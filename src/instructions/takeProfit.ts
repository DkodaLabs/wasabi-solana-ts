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

type TakeProfitCleanupInstructionAccounts = {
    takeProfitOrder: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccounts;
}
type TakeProfitCleanupInstructionAccountsStrict = {
    takeProfitOrder: PublicKey;
    closePositionCleanup: ClosePositionCleanupInstructionAccountsStrict;
}

const takeProfitSetupConfig: BaseMethodConfig<
    ClosePositionSetupArgs,
    ClosePositionSetupAccounts,
    ExitOrderSetupInstructionAccounts | ExitOrderSetupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<ClosePositionSetupArgs, ClosePositionSetupAccounts>) => {
        const { accounts, ixes } = await getClosePositionSetupInstructionAccounts(
            config.program,
            config.accounts,
            CloseType.TAKE_PROFIT,
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
    getMethod: (program) => (args) => program.methods.takeProfitSetup(
        args.minTargetAmount,
        args.interest,
        args.executionFee,
        args.expiration,
    )
};

const takeProfitCleanupConfig: BaseMethodConfig<
    void,
    ClosePositionCleanupAccounts,
    TakeProfitCleanupInstructionAccounts | TakeProfitCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, ClosePositionCleanupAccounts>) => {
        const { accounts, ixes } = await getClosePositionCleanupInstructionAccounts(
            config.program,
            config.accounts,
        );
        const takeProfit = PDA.getTakeProfitOrder(accounts.position);
        return {
            accounts: config.strict ?
                {
                    takeProfitOrder: takeProfit,
                    closePositionCleanup: {
                        ...accounts,
                    }
                } :
                {
                    takeProfitOrder: takeProfit,
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
    getMethod: (program) => () => program.methods.takeProfitCleanup()
};

export async function createTakeProfitSetupInstruction(
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
            takeProfitSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createTakeProfitCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            takeProfitCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}
