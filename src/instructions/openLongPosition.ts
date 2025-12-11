import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY, PublicKey,
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    PDA,
    handleMintsAndTokenProgram,
    getPermission,
    handlePaymentTokenMint, validateArgs, validateProviderPubkey
} from '../utils';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts,
    OpenPositionSetupInstructionBaseAccounts,
} from './openPosition';
import { WasabiSolana } from '../idl/wasabi_solana';
import {TokenMintCache} from "../cache/TokenMintCache";

export type OpenLongPositionSetupInstructionAccounts = {
    ownerCollateralAccount: PublicKey;
    openPositionRequest: PublicKey;
    debtController: PublicKey;
    tokenProgram: PublicKey;
} & OpenPositionSetupInstructionBaseAccounts;

const openLongPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenLongPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>) => {
        const args = validateArgs(config.args);
        const authority = validateProviderPubkey(config.program.provider.publicKey);

        if (!args.nonce) {
            throw new Error('Nonce is required for `openLongPositionSetup');
        }

        const result = await handlePaymentTokenMint(
            config.program.provider.connection,
            config.accounts.owner,
            config.accounts.currency, // payment token mint
            config.accounts.currency,
            config.accounts.collateral,
            'wrap',
            Number(args.downPayment) + Number(args.fee),
            config.mintCache
        );

        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx
        } = result;
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getLongPool(collateralMint, currencyMint);

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.owner,
                    false,
                    currencyTokenProgram
                ),
                ownerCollateralAccount: getAssociatedTokenAddressSync(
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
                position: PDA.getPosition(config.accounts.owner, pool, lpVault, args.nonce),
                authority,
                permission: await getPermission(config.program, authority),
                feeWallet: config.accounts.feeWallet,
                feeWalletAta: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.feeWallet,
                    true,
                    currencyTokenProgram
                ),
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                tokenProgram: currencyTokenProgram,
                systemProgram: SystemProgram.programId,
                sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
            },
            args: {
                nonce: args.nonce,
                minTargetAmount: new BN(args.minTargetAmount.toString()),
                downPayment: new BN(args.downPayment.toString()),
                principal: new BN(args.principal.toString()),
                fee: new BN(args.fee.toString()),
                expiration: new BN(args.expiration.toString())
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.openLongPositionSetup(
            args.nonce,
            args.minTargetAmount,
            args.downPayment,
            args.principal,
            args.fee,
            args.expiration
        )
};

const openLongPositionCleanupConfig: BaseMethodConfig<
    void,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, OpenPositionCleanupAccounts>) => {
        const { currencyMint, collateralMint, currencyTokenProgram, collateralTokenProgram } =
            await handleMintsAndTokenProgram(
                config.program.provider.connection,
                config.accounts.currency,
                config.accounts.collateral,
                { mintCache: config.mintCache }
            );

        return {
            accounts: {
                owner: config.accounts.owner,
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
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position: config.accounts.position,
                tokenProgram: currencyTokenProgram
            }
        };
    },
    getMethod: (program) => () => program.methods.openLongPositionCleanup()
};

export async function createOpenLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionSetupArgs,
    accounts: OpenPositionSetupAccounts,
    mintCache?: TokenMintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}

export async function createOpenLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts,
    mintCache?: TokenMintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionCleanupConfig,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
