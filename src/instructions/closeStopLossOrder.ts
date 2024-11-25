import { Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type CloseStopLossOrderAccounts = {
    position: PublicKey;
};

type CloseStopLossOrderInstructionAccounts = {
    position: PublicKey;
};

type CloseStopLossOrderInstructionAccountsStrict = {
    trader: PublicKey;
    stopLossOrder: PublicKey;
} & CloseStopLossOrderInstructionAccounts;

const closeStopLossOrderConfig: BaseMethodConfig<
    void,
    CloseStopLossOrderAccounts,
    CloseStopLossOrderInstructionAccounts | CloseStopLossOrderInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, CloseStopLossOrderAccounts>) => {
        let permission = PDA.getAdmin(config.program.provider.publicKey);
        const [trader, permissionAccount] = await Promise.all([
            config.program.account.position
                .fetch(config.accounts.position)
                .then((pos) => pos.trader),
            config.program.account.permission.fetch(permission).catch(() => null),
        ]);

        if (!permissionAccount) {
            permission = PDA.getSuperAdmin()
        }

        const allAccounts = {
            closer: config.program.provider.publicKey,
            trader,
            permission,
            position: config.accounts.position,
            stopLossOrder: PDA.getStopLossOrder(config.accounts.position)
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
    getMethod: (program) => () => program.methods.closeStopLossOrder()
};

export async function createCloseStopLossOrderInstruction(
    program: Program<WasabiSolana>,
    accounts: CloseStopLossOrderAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeStopLossOrderConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function closeStopLossOrder(
    program: Program<WasabiSolana>,
    accounts: CloseStopLossOrderAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeStopLossOrderConfig,
            'transaction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionSignature>;
}
