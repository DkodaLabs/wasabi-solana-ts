import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BundleRequestInstructionAccounts,
    getBaseInstructionAccounts,
    BundleRequestAccounts
} from './bundle';

const validateBundleConfig: BaseMethodConfig<
    void,
    BundleRequestAccounts,
    BundleRequestInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, BundleRequestAccounts>) => {
        const accounts = getBaseInstructionAccounts(
            config.accounts.payer,
            config.accounts.authority
        );

        return {
            accounts: {
                ...accounts
            }
        };
    },
    getMethod: (program) => () => program.methods.validateBundle()
};

export async function createValidateBundleInstruction(
    program: Program<WasabiSolana>,
    accounts: BundleRequestAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: validateBundleConfig
    }) as Promise<TransactionInstruction[]>;
}
