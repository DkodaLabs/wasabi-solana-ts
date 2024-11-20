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

const initLongPoolConfig: BaseMethodConfig<
    void,
    InitPoolAccounts,
    InitPoolInstructionAccounts | InitPoolInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, InitPoolAccounts>) => {
        const allAccounts = await getInitPoolInstructionAccounts(
            config.program,
            config.accounts,
            'long'
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
    getMethod: (program) => () => program.methods.initLongPool()
};

export async function createInitLongPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
    strict: boolean = true,
    increaseCompute = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initLongPoolConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initLongPool(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initLongPoolConfig,
            'transaction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionSignature>;
}
