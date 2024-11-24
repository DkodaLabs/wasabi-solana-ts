import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import {
    CloseType,
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionCleanupAccounts,
    ClosePositionSetupInstructionAccounts,
    ClosePositionSetupInstructionAccountsStrict,
    ClosePositionCleanupInstructionAccounts,
    ClosePositionCleanupInstructionAccountsStrict,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    transformArgs
} from './closePosition';
import { WasabiSolana } from '../idl/wasabi_solana';

type LiquidatePositionSetupInstructionAccounts = {
    closePositionSetup: ClosePositionSetupInstructionAccounts,
};

type LiquidatePositionSetupInstructionAccountsStrict = {
    closePositionSetup: ClosePositionSetupInstructionAccountsStrict,
};

type LiquidatePositionCleanupInstructionAccounts = {
    closePositionCleanup: ClosePositionCleanupInstructionAccounts,
}

type LiquidatePositionCleanupInstructionAccountsStrict = {
    closePositionCleanup: ClosePositionCleanupInstructionAccountsStrict,
}

const liquidatePositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    LiquidatePositionSetupInstructionAccounts | LiquidatePositionSetupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            CloseType.LIQUIDATION,
        );

        return {
            accounts: config.strict
                ? {
                    closePositionSetup: {
                        ...accounts
                    }
                }
                : {
                    closePositionSetup: {
                        owner: accounts.owner,
                        position: accounts.position,
                        pool: accounts.pool,
                        collateral: accounts.collateral,
                        permission: accounts.permission,
                        tokenProgram: accounts.tokenProgram
                    }
                },
            args: transformArgs(config.args),
            setup: ixes.setup,
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
    LiquidatePositionCleanupInstructionAccounts | LiquidatePositionCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
        );
        return {
            accounts: config.strict
                ? {
                    closePositionCleanup: {
                        ...accounts
                    }
                }
                : {
                    closePositionCleanup: {
                        owner: accounts.owner,
                        authority: accounts.authority,
                        collateral: accounts.collateral,
                        currency: accounts.currency,
                        position: accounts.position,
                        feeWallet: accounts.feeWallet,
                        collateralTokenProgram: accounts.collateralTokenProgram,
                        currencyTokenProgram: accounts.currencyTokenProgram
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
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            liquidatePositionSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createLiquidatePositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            liquidatePositionCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}
