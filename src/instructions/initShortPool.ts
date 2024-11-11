import { Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import {
    InitPoolAccounts,
    InitPoolInstructionAccounts,
    InitPoolInstructionAccountsStrict,
    getInitPoolInstructionAccounts
} from './initPool';
import { WasabiSolana } from '../idl/wasabi_solana';

const initShortPoolConfig: BaseMethodConfig<
    void,
    InitPoolAccounts,
    InitPoolInstructionAccounts | InitPoolInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, InitPoolAccounts>) => {
        const allAccounts = await getInitPoolInstructionAccounts(
            config.program,
            config.accounts,
            'short'
        );

        return {
            accounts: config.strict
                ? allAccounts
                : {
                      payer: allAccounts.payer,
                      permission: allAccounts.permission,
                      collateral: allAccounts.collateral,
                      currency: allAccounts.currency,
                      collateralTokenProgram: allAccounts.collateralTokenProgram,
                      currencyTokenProgram: allAccounts.currencyTokenProgram
                  }
        };
    },
    getMethod: (program) => () => program.methods.initShortPool()
};

export async function createInitShortPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
    strict: boolean = true,
    increaseCompute = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initShortPoolConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initShortPool(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initShortPoolConfig,
            'transaction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionSignature>;
}
