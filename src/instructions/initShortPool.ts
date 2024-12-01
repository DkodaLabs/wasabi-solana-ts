import { Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import {
    InitPoolAccounts,
    InitPoolInstructionAccounts,
    getInitPoolInstructionAccounts
} from './initPool';
import { WasabiSolana } from '../idl/wasabi_solana';

const initShortPoolConfig: BaseMethodConfig<
    void,
    InitPoolAccounts,
    InitPoolInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, InitPoolAccounts>) => {
        return {
            accounts: await getInitPoolInstructionAccounts(
                config.program,
                config.accounts,
                'short'
            ),
        };
    },
    getMethod: (program) => () => program.methods.initShortPool()
};

export async function createInitShortPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initShortPoolConfig,
            'INSTRUCTION',
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initShortPool(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initShortPoolConfig,
            'TRANSACTION',
        )
    ) as Promise<TransactionSignature>;
}
