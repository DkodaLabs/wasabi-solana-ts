import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionCleanupAccounts,
    ClosePositionSetupInstructionAccounts,
    ClosePositionCleanupInstructionAccounts,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    transformArgs
} from './closePosition';
import { WasabiSolana } from '../idl/wasabi_solana';
import { MintCache } from '../utils';

type LiquidatePositionSetupInstructionAccounts = {
    closePositionSetup: ClosePositionSetupInstructionAccounts;
};

type LiquidatePositionCleanupInstructionAccounts = {
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

const liquidatePositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    LiquidatePositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'LIQUIDATION'
        );

        return {
            accounts: {
                closePositionSetup: {
                    ...accounts
                }
            },
            args: transformArgs(config.args),
            setup: ixes.setupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.liquidatePositionSetup(
            new BN(args.minTargetAmount),
            new BN(args.interest),
            new BN(args.executionFee),
            new BN(args.expiration)
        )
};

const liquidatePositionCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    LiquidatePositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
            true // isTriggeredByAuthority
        );
        return {
            accounts: {
                closePositionCleanup: {
                    ...accounts
                }
            },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx
        };
    },
    getMethod: (program) => () => program.methods.liquidatePositionCleanup()
};

export async function createLiquidatePositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: ClosePositionSetupAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: liquidatePositionSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}

export async function createLiquidatePositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: liquidatePositionCleanupConfig,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
