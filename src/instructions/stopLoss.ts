import { Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
} from '../base';
import {
    transformArgs,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionCleanupAccounts,
    ClosePositionCleanupInstructionAccounts,
    ExitOrderSetupInstructionAccounts
} from './closePosition';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

type StopLossCleanupInstructionAccounts = {
    stopLossOrder: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

const stopLossSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ExitOrderSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'STOP_LOSS'
        );

        return {
            accounts: {
                closePositionSetup: accounts
            },
            args: transformArgs(config.args),
            setup: ixes.setupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.stopLossSetup(
            args.minTargetAmount,
            args.interest,
            args.executionFee,
            args.expiration
        )
};

const stopLossCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    StopLossCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
            true
        );

        const stopLossPubkey = PDA.getStopLossOrder(accounts.position);
        return {
            accounts: {
                stopLossOrder: stopLossPubkey,
                closePositionCleanup: accounts
            },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx
        };
    },
    getMethod: (program) => () => program.methods.stopLossCleanup()
};

export async function createStopLossSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: ClosePositionSetupAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: stopLossSetupConfig,
        feeLevel: {
            level: feeLevel,
            ixType: 'TRADE'
        },
        args
    }) as Promise<TransactionInstruction[]>;
}

export async function createStopLossCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: stopLossCleanupConfig,
    }) as Promise<TransactionInstruction[]>;
}
