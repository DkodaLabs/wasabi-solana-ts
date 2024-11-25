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

type CloseLongPositionSetupInstructionAccounts = {
    owner: PublicKey;
    closePositionSetup: ClosePositionSetupInstructionAccounts;
};

type CloseLongPositionSetupInstructionAccountsStrict = {
    owner: PublicKey;
    closePositionSetup: ClosePositionSetupInstructionAccountsStrict;
};

type CloseLongPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

type CloseLongPositionCleanupInstructionAccountsStrict = {
    owner: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccountsStrict;
};

const closeLongPositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    CloseLongPositionSetupInstructionAccounts | CloseLongPositionSetupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            CloseType.MARKET,
        );

        return {
            accounts: config.strict
                ? {
                    owner: accounts.owner,
                    closePositionSetup: {
                        ...accounts
                    }
                }
                : {
                    owner: accounts.owner,
                    closePositionSetup: {
                        owner: accounts.owner,
                        pool: accounts.pool,
                        collateral: accounts.collateral,
                        position: accounts.position,
                        permission: accounts.permission,
                        authority: accounts.authority,
                        tokenProgram: accounts.tokenProgram
                    }
                },
            args: transformArgs(config.args),
            //setup: ixes.setup,
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
    CloseLongPositionCleanupInstructionAccounts | CloseLongPositionCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
        );
        return {
            accounts: config.strict
                ? {
                    owner: accounts.owner,
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
    getMethod: (program) => () => program.methods.closeLongPositionCleanup()
};

export async function createCloseLongPositionSetupInstruction(
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
            closeLongPositionSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createCloseLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeLongPositionCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}
