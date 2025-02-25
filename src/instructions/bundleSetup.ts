import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BundleSetupArgs,
    BundleCleanupAccounts,
    BundleSetupInstructionAccounts,
    getBundleSetupInstructionAccounts
} from './bundle';

const bundleSetupConfig: BaseMethodConfig<BundleSetupArgs, BundleCleanupAccounts, BundleSetupInstructionAccounts> = {
    process: async (config: ConfigArgs<BundleSetupArgs, BundleCleanupAccounts>) => {
        const accounts = getBundleSetupInstructionAccounts(
            config.accounts.payer,
            config.accounts.authority
        );

        return {
            accounts: {
                payer: config.accounts.payer,
                ...accounts,
            },
            args: {
                numExpectedTx: config.args.numExpectedTx,
                srcMaxDelta: new BN(config.args.srcMaxDelta),
                dstMinDelta: new BN(config.args.dstMinDelta),
            },
        };
    },
    getMethod: (program) => (args) => program.methods.bundleSetup(args.reciprocal, args.numExpectedTx),
};

export async function createBundleSetupInstruction(
    program: Program<WasabiSolana>,
    accounts: BundleCleanupAccounts,
    args: BundleSetupArgs
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: bundleSetupConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
