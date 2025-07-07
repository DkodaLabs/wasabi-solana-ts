import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    PublicKey
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenPositionCleanupAccounts
} from './openPosition';
import {
    PDA,
    getPermission,
    handleMintsAndTokenProgram,
    handlePaymentTokenMint,
    validateArgs,
    validateProviderPayer
} from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';
import { MintCache } from '../utils/mintCache';

export type OpenShortPositionSetupInstructionAccounts = {
    owner: PublicKey;
    ownerCurrencyAccount: PublicKey;
    ownerTargetCurrencyAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    openPositionRequest: PublicKey;
    position: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    feeWalletAta: PublicKey;
    globalSettings: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
};

export type OpenShortPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    openPositionRequest: PublicKey;
    debtController: PublicKey;
    tokenProgram: PublicKey;
};

const openShortPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenShortPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>) => {
        const { nonce, minTargetAmount, downPayment, principal, fee, expiration } = validateArgs(config.args);
        const payer = validateProviderPayer(config.program.provider.publicKey);

        if (!nonce) {
            throw new Error("Nonce is required for 'openShortPositionSetup'");
        }


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
            Number(downPayment) + Number(fee),
            config.mintCache
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
                position: PDA.getPosition(config.accounts.owner, pool, lpVault, nonce),
                authority: payer,
                permission: await getPermission(config.program, payer),
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
                nonce: nonce,
                minTargetAmount: new BN(minTargetAmount),
                downPayment: new BN(downPayment),
                principal: new BN(principal),
                fee: new BN(fee),
                expiration: new BN(expiration)
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
                config.accounts.collateral,
                { owner: config.accounts.pool, mintCache: config.mintCache }
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
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openShortPositionSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}

export async function createOpenShortPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openShortPositionCleanupConfig,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
