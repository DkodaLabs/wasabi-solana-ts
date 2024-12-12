import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    InitPoolAccounts,
    InitPoolInstructionAccounts,
    getInitPoolInstructionAccounts
} from './initPool';
import { WasabiSolana } from '../idl/wasabi_solana';

const initLongPoolConfig: BaseMethodConfig<void, InitPoolAccounts, InitPoolInstructionAccounts> = {
    process: async (config: ConfigArgs<void, InitPoolAccounts>) => {
        return {
            accounts: await getInitPoolInstructionAccounts(config.program, config.accounts, 'long')
        };
    },
    getMethod: (program) => () => program.methods.initLongPool()
};

export async function createInitLongPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: initLongPoolConfig,
    }) as Promise<TransactionInstruction[]>;
}
