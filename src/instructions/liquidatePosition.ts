import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import {
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
        const allAccounts = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts
        );
        console.log(allAccounts);

        return {
            accounts: config.strict
                ? {
                    closePositionSetup: {
                        ...allAccounts
                    }
                }
                : {
                    closePositionSetup: {
                        owner: allAccounts.owner,
                        position: allAccounts.position,
                        pool: allAccounts.pool,
                        collateral: allAccounts.collateral,
                        permission: allAccounts.permission,
                        tokenProgram: allAccounts.tokenProgram
                    }
                },
            args: transformArgs(config.args)
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
        const allAccounts = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts
        );
        return {
            accounts: config.strict
                ? {
                    closePositionCleanup: {
                        ...allAccounts
                    }
                }
                : {
                    closePositionCleanup: {
                        owner: allAccounts.owner,
                        authority: allAccounts.authority,
                        collateral: allAccounts.collateral,
                        currency: allAccounts.currency,
                        position: allAccounts.position,
                        feeWallet: allAccounts.feeWallet,
                        collateralTokenProgram: allAccounts.collateralTokenProgram,
                        currencyTokenProgram: allAccounts.currencyTokenProgram
                    }
                }
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
