import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionSetupInstructionAccounts,
    ClosePositionCleanupAccounts,
    ClosePositionCleanupInstructionAccounts,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    transformArgs
} from './closePosition';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import { MintCache } from '../utils';

type CloseLongPositionSetupInstructionAccounts = {
    owner: PublicKey;
    closePositionSetup: ClosePositionSetupInstructionAccounts;
};

type CloseLongPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

const closeLongPositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    CloseLongPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'MARKET',
            config.mintCache
        );

        return {
            accounts: {
                owner: accounts.owner,
                closePositionSetup: {
                    ...accounts
                }
            },
            args: transformArgs(config.args),
            setup: ixes.setupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.closeLongPositionSetup(
            args.minTargetAmount,
            args.interest,
            args.executionFee,
            args.expiration
        )
};

const closeLongPositionCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    CloseLongPositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts
        );
        return {
            accounts: {
                owner: accounts.owner,
                closePositionCleanup: {
                    ...accounts
                }
            },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx
        };
    },
    getMethod: (program) => () => program.methods.closeLongPositionCleanup()
};

export async function createCloseLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: ClosePositionSetupAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closeLongPositionSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}

export async function createCloseLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closeLongPositionCleanupConfig,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
