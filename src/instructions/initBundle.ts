import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    InitBundleCacheArgs,
    BundleCacheAccounts,
    InitBundleCacheInstructionAccounts,
    getInitBundleCacheInstructionAccounts
} from './bundleCache';

const initBundleCacheConfig: BaseMethodConfig<InitBundleCacheArgs, BundleCacheAccounts, InitBundleCacheInstructionAccounts> = {
    process: async (config: ConfigArgs<InitBundleCacheArgs, BundleCacheAccounts>) => {
        const accounts = getInitBundleCacheInstructionAccounts(
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
    getMethod: (program) => (args) => program.methods.initBundle(
        args.numExpectedTx,
        args.srcMaxDelta,
        args.dstMinDelta
    )
};

export async function createInitBundleCacheInstruction(
    program: Program<WasabiSolana>,
    accounts: BundleCacheAccounts,
    args: InitBundleCacheArgs
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: initBundleCacheConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
