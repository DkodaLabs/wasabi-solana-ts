import { Program } from '@coral-xyz/anchor';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
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
import { PDA, validateArgs } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';
import {TokenMintCache} from "../cache/TokenMintCache";

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
        const args = validateArgs(config.args);
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'STOP_LOSS'
        );

        return {
            accounts: {
                closePositionSetup: accounts
            },
            args: transformArgs(args),
            setup: ixes.setupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.stopLossSetup(
            args.amount,
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
    mintCache?: TokenMintCache,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: stopLossSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}

export async function createStopLossCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    mintCache?: TokenMintCache,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: stopLossCleanupConfig,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
