import { Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import {
    InitPoolAccounts,
    InitPoolInstructionAccounts,
    getInitPoolInstructionAccounts
} from './initPool';
import { WasabiSolana } from '../idl/wasabi_solana';

const initLongPoolConfig: BaseMethodConfig<
    void,
    InitPoolAccounts,
    InitPoolInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, InitPoolAccounts>) => {
        return {
            accounts: await getInitPoolInstructionAccounts(
                config.program,
                config.accounts,
                'long'
            ),
        };
    },
    getMethod: (program) => () => program.methods.initLongPool()
};

export async function createInitLongPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initLongPoolConfig,
            'INSTRUCTION',
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initLongPool(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initLongPoolConfig,
            'TRANSACTION',
        )
    ) as Promise<TransactionSignature>;
}
