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
        const trader = await config.program.account.position
            .fetch(config.accounts.position)
            .then((pos) => pos.trader);
        const allAccounts = {
            trader,
            position: config.accounts.position,
            stopLossOrder: PDA.getStopLossOrder(config.accounts.position)
        };
        return {
            accounts: config.strict
                ? allAccounts
                : {
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
