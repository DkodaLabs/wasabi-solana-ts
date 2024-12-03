import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import {
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts,
    OpenPositionSetupInstructionBaseAccounts
} from './openPosition';
import {
    PDA,
    getPermission,
    handleMintsAndTokenProgram,
    handlePaymentTokenMint
} from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

type OpenShortPositionSetupInstructionAccounts = {
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
} & OpenPositionSetupInstructionBaseAccounts;

type OpenShortPositionCleanupInstructionAccounts = {
    vault: PublicKey;
    debtController: PublicKey;
} & OpenPositionCleanupInstructionAccounts;

const openShortPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenShortPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>) => {
        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx
        } = await handlePaymentTokenMint(
          config.program.provider.connection,
          config.accounts.owner,
          config.accounts.collateral, // payment token mint
          config.accounts.currency,
          config.accounts.collateral,
          'wrap',
          Number(config.args.downPayment) + Number(config.args.fee)
        );
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getShortPool(collateralMint, currencyMint);

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.owner,
                    false,
                    currencyTokenProgram
                ),
                ownerTargetCurrencyAccount: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.owner,
                    false,
                    collateralTokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    currencyMint,
                    lpVault,
                    true,
                    currencyTokenProgram
                ),
                pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    pool,
                    true,
                    currencyTokenProgram
                ),
                currency: currencyMint,
                collateral: collateralMint,
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position: PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce),
                authority: config.program.provider.publicKey,
                permission: await getPermission(config.program, config.program.provider.publicKey),
                feeWallet: config.accounts.feeWallet,
                feeWalletAta: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.feeWallet,
                    true,
                    collateralTokenProgram
                ),
                globalSettings: PDA.getGlobalSettings(),
                currencyTokenProgram,
                collateralTokenProgram,
                systemProgram: SystemProgram.programId,
                sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
            },
            args: {
                nonce: config.args.nonce,
                minTargetAmount: new BN(config.args.minTargetAmount),
                downPayment: new BN(config.args.downPayment),
                principal: new BN(config.args.principal),
                fee: new BN(config.args.fee),
                expiration: new BN(config.args.expiration)
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.openShortPositionSetup(
            args.nonce,
            args.minTargetAmount,
            args.downPayment,
            args.principal,
            args.fee,
            args.expiration
        )
};

const openShortPositionCleanupConfig: BaseMethodConfig<
    void,
    OpenPositionCleanupAccounts,
    OpenShortPositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, OpenPositionCleanupAccounts>) => {
        const { currencyMint, collateralMint, currencyTokenProgram, collateralTokenProgram } =
            await handleMintsAndTokenProgram(
                config.program.provider.connection,
                config.accounts.currency,
                config.accounts.collateral
            );
        const lpVault = PDA.getLpVault(config.accounts.currency);

        return {
            accounts: {
                owner: config.accounts.owner,
                position: config.accounts.position,
                pool: config.accounts.pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.pool,
                    true,
                    currencyTokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    currencyMint,
                    lpVault,
                    true,
                    currencyTokenProgram
                ),
                collateral: collateralMint,
                currency: currencyMint,
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                debtController: PDA.getDebtController(),
                tokenProgram: currencyTokenProgram
            }
        };
    },
    getMethod: (program) => () => program.methods.openShortPositionCleanup()
};

export async function createOpenShortPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionSetupArgs,
    accounts: OpenPositionSetupAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            openShortPositionSetupConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'TRADE'
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createOpenShortPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, openShortPositionCleanupConfig, 'INSTRUCTION')
    ) as Promise<TransactionInstruction[]>;
}
