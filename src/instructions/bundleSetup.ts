import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BundleSetupArgs,
    BundleRequestAccounts,
    BundleSetupInstructionAccounts,
    getBundleInstructionAccounts
} from './bundle';

const bundleSetupConfig: BaseMethodConfig<
    BundleSetupArgs,
    BundleRequestAccounts,
    BundleSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<BundleSetupArgs, BundleRequestAccounts>) => {
        const accounts = getBundleInstructionAccounts(
            config.accounts.payer,
            config.accounts.authority
        );

        return {
            accounts: {
                payer: config.accounts.payer,
                ...accounts
            },
            args: {
                reciprocal: config.args.reciprocal,
                numExpectedTx: config.args.numExpectedTxns
            }
        };
    },
    getMethod: (program) => (args) =>
        program.methods.bundleSetup(args.reciprocal, args.numExpectedTx)
};

export async function createBundleSetupInstruction(
    program: Program<WasabiSolana>,
    accounts: BundleRequestAccounts,
    args: BundleSetupArgs
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: bundleSetupConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
