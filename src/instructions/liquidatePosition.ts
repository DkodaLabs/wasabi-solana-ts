import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
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

type LiquidatePositionSetupInstructionAccounts = {
    closePositionSetup: ClosePositionSetupInstructionAccounts,
};

type LiquidatePositionCleanupInstructionAccounts = {
    closePositionCleanup: ClosePositionCleanupInstructionAccounts,
}

const liquidatePositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    LiquidatePositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'LIQUIDATION',
        );

        return {
            accounts: {
                closePositionSetup: {
                    ...accounts
                }
            },
            args: transformArgs(config.args),
            setup: ixes.setupIx,
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
        );
        return {
            accounts: {
                closePositionCleanup: {
                    ...accounts
                }
            },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx,
        };
    },
    getMethod: (program) => () => program.methods.liquidatePositionCleanup()
};

export async function createLiquidatePositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: ClosePositionSetupAccounts,
    feeLevel: Level = 'NORMAL',
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            liquidatePositionSetupConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'TRADE',
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createLiquidatePositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            liquidatePositionCleanupConfig,
            'INSTRUCTION',
        )
    ) as Promise<TransactionInstruction[]>;
}
