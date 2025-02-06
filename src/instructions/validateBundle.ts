
import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    ValidateBundleInstructionAccounts,
    getBaseInstructionAccounts,
    ValidateBundleAccounts
} from './bundleCache';

const validateBundleConfig: BaseMethodConfig<void, ValidateBundleAccounts, ValidateBundleInstructionAccounts> = {
    process: async (config: ConfigArgs<void, ValidateBundleAccounts>) => {
        const accounts = getBaseInstructionAccounts(
            config.accounts.payer,
            config.accounts.authority
        );

        return {
            accounts: {
                ...accounts,
                src: config.accounts.src,
                dst: config.accounts.dst,
            }
        };
    },
    getMethod: (program) => () => program.methods.validateBundle()
};

export async function createValidateBundleInstruction(
    program: Program<WasabiSolana>,
    accounts: ValidateBundleAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: validateBundleConfig,
    }) as Promise<TransactionInstruction[]>;
}
