import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import {
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ClosePositionSetupInstructionAccounts,
    ClosePositionCleanupAccounts,
    ClosePositionCleanupInstructionAccounts,
    getClosePositionSetupInstructionAccounts,
    getClosePositionCleanupInstructionAccounts,
    transformArgs
} from './closePosition';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';

type CloseLongPositionSetupInstructionAccounts = {
    owner: PublicKey;
    closePositionSetup: ClosePositionSetupInstructionAccounts;
};

type CloseLongPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
};

const closeLongPositionSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    CloseLongPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            'MARKET'
        );

        return {
            accounts: {
                owner: accounts.owner,
                closePositionSetup: {
                    ...accounts
                }
            },
            args: transformArgs(config.args),
            setup: ixes.setupIx
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
    CloseLongPositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts
        );
        return {
            accounts: {
                owner: accounts.owner,
                closePositionCleanup: {
                    ...accounts
                }
            },
            setup: ixes.setupIx,
            cleanup: ixes.cleanupIx
        };
    },
    getMethod: (program) => () => program.methods.closeLongPositionCleanup()
};

export async function createCloseLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: ClosePositionSetupAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            closeLongPositionSetupConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'TRADE'
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createCloseLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, closeLongPositionCleanupConfig, 'INSTRUCTION')
    ) as Promise<TransactionInstruction[]>;
}
