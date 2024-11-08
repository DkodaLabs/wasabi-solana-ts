import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
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
        const allAccounts = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts
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
        const allAccounts = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts
        );
        return {
            accounts: config.strict
                ? {
                      owner: allAccounts.owner,
                      closePositionCleanup: {
                          ...allAccounts
                      }
                  }
                : {
                      owner: allAccounts.owner,
                      closePositionCleanup: {
                          owner: allAccounts.owner,
                          pool: allAccounts.pool,
                          position: allAccounts.position,
                          currency: allAccounts.currency,
                          collateral: allAccounts.collateral,
                          authority: allAccounts.authority,
                          feeWallet: allAccounts.feeWallet,
                          collateralTokenProgram: allAccounts.collateralTokenProgram,
                          currencyTokenProgram: allAccounts.currencyTokenProgram
                      }
                  }
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
