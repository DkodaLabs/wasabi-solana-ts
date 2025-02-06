import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    CloseBundleArgs,
    CloseBundleAccounts,
    CloseBundleCacheInstructionAccounts,
    getInitBundleCacheInstructionAccounts
} from './bundleCache';

const closeBundleCacheConfig: BaseMethodConfig<CloseBundleArgs, CloseBundleAccounts, CloseBundleCacheInstructionAccounts> = {
    process: async (config: ConfigArgs<CloseBundleArgs, CloseBundleAccounts>) => {
        const accounts = getInitBundleCacheInstructionAccounts(
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
    getMethod: (program) => (args) => program.methods.closeBundle(args.tipAmount)
};

export async function createCloseBundleCacheInstruction(
    program: Program<WasabiSolana>,
    accounts: CloseBundleAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closeBundleCacheConfig,
    }) as Promise<TransactionInstruction[]>;
}
