import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
    CloseType,
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionSetupInstructionAccounts,
    ClosePositionSetupInstructionAccountsStrict,
    ClosePositionCleanupAccounts,
    ClosePositionCleanupInstructionAccounts,
    ClosePositionCleanupInstructionAccountsStrict,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    transformArgs
} from './closePosition';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';

type CloseShortPositionSetupInstructionAccounts = {
    owner: PublicKey;
    closePositionSetup: ClosePositionSetupInstructionAccounts;
};

type CloseShortPositionSetupInstructionAccountsStrict = {
    owner: PublicKey;
    closePositionSetup: ClosePositionSetupInstructionAccountsStrict;
};

type CloseShortPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

type CloseShortPositionCleanupInstructionAccountsStrict = {
    owner: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccountsStrict;
};

const closeShortPositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    CloseShortPositionSetupInstructionAccounts | CloseShortPositionSetupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const allAccounts = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
        );

        return {
            accounts: config.strict
                ? {
                    owner: allAccounts.owner,
                    closePositionSetup: {
                        ...allAccounts
                    }
                }
                : {
                    owner: allAccounts.owner,
                    closePositionSetup: {
                        owner: allAccounts.owner,
                        pool: allAccounts.pool,
                        collateral: allAccounts.collateral,
                        position: allAccounts.position,
                        permission: allAccounts.permission,
                        authority: allAccounts.authority,
                        tokenProgram: allAccounts.tokenProgram
                    }
                },
            args: transformArgs(config.args)
        };
    },
    getMethod: (program) => (args) =>
        program.methods.closeShortPositionSetup(
            args.minTargetAmount,
            args.interest,
            args.executionFee,
            args.expiration
        )
};

const closeShortPositionCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    | CloseShortPositionCleanupInstructionAccounts
    | CloseShortPositionCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
            CloseType.MARKET,
        );
        return {
            accounts: config.strict
                ? {
                    owner: accounts.owner,
                    ownerCollateralAccount: accounts.ownerCollateralAccount,
                    collateral: accounts.collateral,
                    collateralTokenProgram: accounts.collateralTokenProgram,
                    closePositionCleanup: {
                        ...accounts
                    }
                }
                : {
                    owner: accounts.owner,
                    closePositionCleanup: {
                        owner: accounts.owner,
                        pool: accounts.pool,
                        position: accounts.position,
                        currency: accounts.currency,
                        collateral: accounts.collateral,
                        authority: accounts.authority,
                        feeWallet: accounts.feeWallet,
                        collateralTokenProgram: accounts.collateralTokenProgram,
                        currencyTokenProgram: accounts.currencyTokenProgram
                    }
                },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx,
        };
    },
    getMethod: (program) => () => program.methods.closeShortPositionCleanup()
};

export async function createCloseShortPositionSetupInstruction(
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
            closeShortPositionSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createCloseShortPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeShortPositionCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}
