import { Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type CloseTakeProfitOrderAccounts = {
    position: PublicKey;
};

type CloseTakeProfitOrderInstructionAccounts = {
    position: PublicKey;
};

type CloseTakeProfitOrderInstructionAccountsStrict = {
    trader: PublicKey;
    takeProfitOrder: PublicKey;
} & CloseTakeProfitOrderInstructionAccounts;

const closeTakeProfitOrderConfig: BaseMethodConfig<
    void,
    CloseTakeProfitOrderAccounts,
    CloseTakeProfitOrderInstructionAccounts | CloseTakeProfitOrderInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, CloseTakeProfitOrderAccounts>) => {
        let permission = PDA.getAdmin(config.program.provider.publicKey);
        const [trader, permissionAccount] = await Promise.all([
            config.program.account.position
                .fetch(config.accounts.position)
                .then((pos) => pos.trader),
            config.program.account.permission.fetch(permission).catch(() => null),
        ]);

        if (!permissionAccount) {
            permission = PDA.getSuperAdmin();
        }

        const allAccounts = {
            closer: config.program.provider.publicKey,
            trader,
            permission,
            position: config.accounts.position,
            takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position)
        };
        return {
            accounts: config.strict
                ? allAccounts
                : {
                    closer: allAccounts.closer,
                    permission,
                    position: config.accounts.position
                }
        };
    },
    getMethod: (program) => () => program.methods.closeTakeProfitOrder()
};

export async function createCloseTakeProfitOrderInstruction(
    program: Program<WasabiSolana>,
    accounts: CloseTakeProfitOrderAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeTakeProfitOrderConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function closeTakeProfitOrder(
    program: Program<WasabiSolana>,
    accounts: CloseTakeProfitOrderAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeTakeProfitOrderConfig,
            'transaction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionSignature>;
}
