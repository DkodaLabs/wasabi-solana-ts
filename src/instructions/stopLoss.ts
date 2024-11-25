import { Program } from '@coral-xyz/anchor';
import {
    PublicKey,
    TransactionInstruction,
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import {
    transformArgs,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    CloseType,
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionCleanupAccounts,
    ClosePositionCleanupInstructionAccounts,
    ClosePositionCleanupInstructionAccountsStrict,
    ExitOrderSetupInstructionAccounts,
    ExitOrderSetupInstructionAccountsStrict,
} from './closePosition';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

type StopLossCleanupInstructionAccounts = {
    stopLossOrder: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
}
type StopLossCleanupInstructionAccountsStrict = {
    stopLossOrder: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccountsStrict;
}

const stopLossSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ExitOrderSetupInstructionAccounts | ExitOrderSetupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            CloseType.STOP_LOSS,
        );

        return {
            accounts: config.strict ? {
                closePositionSetup: accounts
            } : {
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
            setup: ixes.setup,
        };
    },
    getMethod: (program) => (args) => program.methods.stopLossSetup(
        args.minTargetAmount,
        args.interest,
        args.executionFee,
        args.expiration,
    )
};

const stopLossCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    StopLossCleanupInstructionAccounts | StopLossCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
        );

        const stopLossPubkey = PDA.getStopLossOrder(accounts.position);
        console.log(stopLossPubkey);
        return {
            accounts: config.strict
                ? {
                    stopLossOrder: stopLossPubkey,
                    closePositionCleanup: accounts
                } :
                {
                    stopLossOrder: stopLossPubkey,
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
    getMethod: (program) => () => program.methods.stopLossCleanup()
};

export async function createStopLossSetupInstruction(
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
            stopLossSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createStopLossCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            stopLossCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}

