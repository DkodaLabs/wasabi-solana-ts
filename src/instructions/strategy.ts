import { Program, BN } from '@coral-xyz/anchor';
import {
    Connection,
    SystemProgram,
    TransactionInstruction,
    PublicKey,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    getTokenProgram,
    PDA,
    validateProviderPubkey,
    WASABI_PROGRAM_ID
} from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type StrategyParams = StrategyArgs & StrategyAccounts;

export type StrategyAction = 'INIT' | 'DEPOSIT' | 'WITHDRAW' | 'CLOSE' | 'CLAIM';

export type StrategyArgs = {
    amountIn: number;
    minAmountOut: number;
};

export type StrategyClaimArgs = {
    newQuote: number;
};

export type StrategyAccounts = {
    authority: PublicKey;
    principal: PublicKey;
    collateral: PublicKey;
};

export type StrategyBaseInstructionAccounts = {
    authority: PublicKey;
    permission: PublicKey;
    lpVault: PublicKey;
    collateral: PublicKey;
};

export type StrategyAccountsTokenProgram = StrategyInstructionAccounts & {
    collateralTokenProgram: PublicKey;
    principalTokenProgram: PublicKey;
};

export type StrategyInstructionAccounts = StrategyClaimInstructionAccounts & {
    vault: PublicKey;
    collateralVault: PublicKey;
    strategyRequest: PublicKey;
    tokenProgram: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
};

export type InitStrategyInstructionAccounts = StrategyClaimInstructionAccounts & {
    vault: PublicKey;
    currency: PublicKey;
    collateralVault: PublicKey;
};

export type CloseStrategyInstructionAccounts = StrategyClaimInstructionAccounts & {
    collateralVault: PublicKey;
    tokenProgram: PublicKey;
};

export type StrategyClaimInstructionAccounts = StrategyBaseInstructionAccounts & {
    strategy: PublicKey;
};

export const getStrategyAccounts = async (
    connection: Connection,
    authority: PublicKey,
    principal: PublicKey,
    collateral: PublicKey
): Promise<StrategyAccountsTokenProgram> => {
    const permission = PDA.getAdmin(authority);
    const lpVault = PDA.getLpVault(principal);
    const [principalTokenProgram, collateralTokenProgram] = await Promise.all([
        getTokenProgram(connection, principal),
        getTokenProgram(connection, collateral)
    ]);

    if (!principalTokenProgram || !collateralTokenProgram) {
        throw new Error('Token program not found');
    }

    const vault = getAssociatedTokenAddressSync(principal, lpVault, true, principalTokenProgram);
    const collateralVault = getAssociatedTokenAddressSync(
        collateral,
        lpVault,
        true,
        collateralTokenProgram
    );

    const strategy = PDA.getStrategy(lpVault, collateral);
    const strategyRequest = PDA.getStrategyRequest(strategy);

    return {
        authority,
        permission,
        collateral,
        lpVault,
        vault,
        collateralVault,
        strategy,
        strategyRequest,
        tokenProgram: principalTokenProgram,
        systemProgram: SystemProgram.programId,
        sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY,
        collateralTokenProgram,
        principalTokenProgram
    };
};

export const initStrategyConfig: BaseMethodConfig<
    void,
    StrategyAccounts,
    InitStrategyInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const {
            authority,
            permission,
            lpVault,
            collateral,
            vault,
            collateralVault,
            strategy,
            systemProgram,
            collateralTokenProgram
        } = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        const setupIx = createAssociatedTokenAccountIdempotentInstruction(
            payer,
            collateralVault,
            lpVault,
            collateral,
            collateralTokenProgram
        );

        return {
            accounts: {
                authority,
                permission,
                collateral,
                currency: config.accounts.principal,
                lpVault,
                vault,
                collateralVault,
                strategy,
                systemProgram
            },
            setup: [setupIx]
        };
    },
    getMethod: (program) => () => program.methods.initStrategy()
};

export const strategyDepositSetupConfig: BaseMethodConfig<
    StrategyArgs,
    StrategyAccounts,
    StrategyInstructionAccounts
> = {
    process: async (config: ConfigArgs<StrategyArgs, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const accounts = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        return {
            accounts,
            args: config.args
        };
    },
    getMethod: (program) => (args) =>
        program.methods.strategyDepositSetup(new BN(args.amountIn), new BN(args.minAmountOut))
};

export const strategyDepositCleanupConfig: BaseMethodConfig<
    void,
    StrategyAccounts,
    StrategyInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const accounts = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        return {
            accounts
        };
    },
    getMethod: (program) => () => program.methods.strategyDepositCleanup()
};

export const strategyWithdrawSetupConfig: BaseMethodConfig<
    StrategyArgs,
    StrategyAccounts,
    StrategyInstructionAccounts
> = {
    process: async (config: ConfigArgs<StrategyArgs, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const accounts = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        return {
            accounts,
            args: config.args
        };
    },
    getMethod: (program) => (args) =>
        program.methods.strategyWithdrawSetup(new BN(args.amountIn), new BN(args.minAmountOut))
};

export const strategyWithdrawCleanupConfig: BaseMethodConfig<
    void,
    StrategyAccounts,
    StrategyInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const accounts = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        return {
            accounts: {
                ...accounts,
                wasabiProgram: WASABI_PROGRAM_ID
            }
        };
    },
    getMethod: (program) => () => program.methods.strategyWithdrawCleanup()
};

export const strategyClaimConfig: BaseMethodConfig<
    StrategyClaimArgs,
    StrategyAccounts,
    StrategyClaimInstructionAccounts
> = {
    process: async (config: ConfigArgs<StrategyClaimArgs, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const { authority, permission, lpVault, collateral, strategy } = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        return {
            accounts: {
                authority,
                permission,
                lpVault,
                collateral,
                strategy
            },
            args: config.args
        };
    },
    getMethod: (program) => (args) => program.methods.strategyClaimYield(new BN(args.newQuote))
};

export const closeStrategyConfig: BaseMethodConfig<
    void,
    StrategyAccounts,
    CloseStrategyInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, StrategyAccounts>) => {
        const payer = validateProviderPubkey(config.program.provider.publicKey);
        const {
            authority,
            permission,
            lpVault,
            collateral,
            strategy,
            collateralVault,
            tokenProgram
        } = await getStrategyAccounts(
            config.program.provider.connection,
            payer,
            config.accounts.principal,
            config.accounts.collateral
        );

        return {
            accounts: {
                authority,
                permission,
                lpVault,
                collateral,
                strategy,
                collateralVault,
                tokenProgram
            }
        };
    },
    getMethod: (program) => () => program.methods.closeStrategy()
};

export async function createInitStrategyInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: initStrategyConfig
    }) as Promise<TransactionInstruction[]>;
}

export async function createStrategyDepositSetupInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts,
    args: StrategyArgs
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: strategyDepositSetupConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}

export async function createStrategyDepositCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: strategyDepositCleanupConfig
    }) as Promise<TransactionInstruction[]>;
}

export async function createStrategyDepositInstructions(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts,
    args: StrategyArgs
): Promise<TransactionInstruction[]> {
    const [setupIx, cleanupIx] = await Promise.all([
        createStrategyDepositSetupInstruction(program, accounts, args),
        createStrategyDepositCleanupInstruction(program, accounts)
    ]);

    return [...setupIx, ...cleanupIx];
}

export async function createStrategyWithdrawSetupInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts,
    args: StrategyArgs
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: strategyWithdrawSetupConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}

export async function createStrategyWithdrawCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: strategyWithdrawCleanupConfig
    }) as Promise<TransactionInstruction[]>;
}

export async function createStrategyWithdrawInstructions(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts,
    args: StrategyArgs
): Promise<TransactionInstruction[]> {
    const [setupIx, cleanupIx] = await Promise.all([
        createStrategyWithdrawSetupInstruction(program, accounts, args),
        createStrategyWithdrawCleanupInstruction(program, accounts)
    ]);

    return [...setupIx, ...cleanupIx];
}

export async function createStrategyClaimInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts,
    args: StrategyClaimArgs
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: strategyClaimConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}

export async function createCloseStrategyInstruction(
    program: Program<WasabiSolana>,
    accounts: StrategyAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closeStrategyConfig
    }) as Promise<TransactionInstruction[]>;
}
