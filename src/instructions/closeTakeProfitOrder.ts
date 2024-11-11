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
    stopLossOrder: PublicKey;
} & CloseTakeProfitOrderInstructionAccounts;

const closeTakeProfitOrderConfig: BaseMethodConfig<
    void,
    CloseTakeProfitOrderAccounts,
    CloseTakeProfitOrderInstructionAccounts | CloseTakeProfitOrderInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, CloseTakeProfitOrderAccounts>) => {
        const trader = await config.program.account.position
            .fetch(config.accounts.position)
            .then((pos) => pos.trader);
        const allAccounts = {
            trader,
            position: config.accounts.position,
            stopLossOrder: PDA.getTakeProfitOrder(config.accounts.position)
        };
        return {
            accounts: config.strict
                ? allAccounts
                : {
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
