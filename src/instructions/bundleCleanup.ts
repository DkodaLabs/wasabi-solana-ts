import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BundleCleanupArgs,
    BundleCleanupAccounts,
    BundleCleanupInstructionAccounts,
    getBundleSetupInstructionAccounts
} from './bundle';

const bundleCleanupConfig: BaseMethodConfig<BundleCleanupArgs, BundleCleanupAccounts, BundleCleanupInstructionAccounts> = {
    process: async (config: ConfigArgs<BundleCleanupArgs, BundleCleanupAccounts>) => {
        const accounts = getBundleSetupInstructionAccounts(
            config.accounts.payer, 
            config.accounts.authority
        );

        return {
            accounts: {
                ...accounts,
                src: config.accounts.src,
                dst: config.accounts.dst,
                tipRecipient: config.accounts.tipReceiver
            },
            args: new BN(config.args.tipAmount)
        };
    },
    getMethod: (program) => (args) => program.methods.bundleCleanup(args.tipAmount)
};

export async function createBundleCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: BundleCleanupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: bundleCleanupConfig,
    }) as Promise<TransactionInstruction[]>;
}
