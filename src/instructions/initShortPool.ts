import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    InitPoolAccounts,
    InitPoolInstructionAccounts,
    getInitPoolInstructionAccounts
} from './initPool';
import { WasabiSolana } from '../idl/wasabi_solana';

const initShortPoolConfig: BaseMethodConfig<void, InitPoolAccounts, InitPoolInstructionAccounts> = {
    process: async (config: ConfigArgs<void, InitPoolAccounts>) => {
        return {
            accounts: await getInitPoolInstructionAccounts(config.program, config.accounts, 'short')
        };
    },
    getMethod: (program) => () => program.methods.initShortPool()
};

export async function createInitShortPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: initShortPoolConfig,
    }) as Promise<TransactionInstruction[]>;
}
