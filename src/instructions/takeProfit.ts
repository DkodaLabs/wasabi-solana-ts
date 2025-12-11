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

type TakeProfitCleanupInstructionAccounts = {
    takeProfitOrder: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

const takeProfitSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ExitOrderSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const args = validateArgs(config.args);

        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'TAKE_PROFIT'
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
        program.methods.takeProfitSetup(
            args.amount,
            args.minTargetAmount,
            args.interest,
            args.executionFee,
            args.expiration
        )
};

const takeProfitCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    TakeProfitCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
            true
        );

        return {
            accounts: {
                takeProfitOrder: PDA.getTakeProfitOrder(accounts.position),
                closePositionCleanup: {
                    ...accounts
                }
            },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx
        };
    },
    getMethod: (program) => () => program.methods.takeProfitCleanup()
};

export async function createTakeProfitSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: ClosePositionSetupAccounts,
    mintCache?: TokenMintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: takeProfitSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}

export async function createTakeProfitCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    mintCache?: TokenMintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: takeProfitCleanupConfig,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
