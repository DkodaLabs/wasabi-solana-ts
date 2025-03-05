import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BundleCleanupArgs,
    BundleCleanupAccounts,
    BundleCleanupInstructionAccounts,
    getBundleInstructionAccounts
} from './bundle';

const bundleCleanupConfig: BaseMethodConfig<BundleCleanupArgs, BundleCleanupAccounts, BundleCleanupInstructionAccounts> = {
    process: async (config: ConfigArgs<BundleCleanupArgs, BundleCleanupAccounts>) => {
        const accounts = getBundleInstructionAccounts(
            config.accounts.payer,
            config.accounts.authority
        );

        return {
            accounts: {
                ...accounts,
                reciprocal: config.accounts.reciprocal,
                tipAccount: config.accounts.tipAccount
            },
            args: new BN(config.args.tipAmount)
        };
    },
    getMethod: (program) => (args) => program.methods.bundleCleanup(args.tipAmount)
};

export async function createBundleCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: BundleCleanupAccounts,
    args: BundleCleanupArgs,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: bundleCleanupConfig,
        args,
    }) as Promise<TransactionInstruction[]>;
}
