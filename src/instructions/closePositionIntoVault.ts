import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { WasabiSolana } from '../idl';
import { BN, Program } from '@coral-xyz/anchor';
import {
    handleCloseTokenAccounts,
    PDA,
    validateArgs,
    validateMintCache,
    WASABI_PROGRAM_ID
} from '../utils';
import {
    TOKEN_2022_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import { extractInstructionData } from './shared';
import { handleOrdersCheck } from './closePosition';
import { ClosePositionInternalInstructionAccounts } from './closePositionV2';
import { TokenInstructionAccounts } from './tokenAccounts';
import { TokenMintCache } from '../cache/TokenMintCache';
import { findPoolCached } from '../cache/BasePoolCache';

export type ClosePositionIntoVaultArgs = {
    amount: number | bigint;
    minTargetAmount: number | bigint;
    interest: number | bigint;
    executionFee: number | bigint;
    expiration: number | bigint;
    instructions: TransactionInstruction[];
};

export type ClosePositionIntoVaultAccounts = {
    owner: PublicKey;
    authority: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    feeWallet: PublicKey;
    liquidationWallet: PublicKey;
};

type ClosePositionIntoVaultInstructionAccounts = {
    deposit: TokenInstructionAccounts;
    closePosition: ClosePositionInternalInstructionAccounts;
};

const closePositionIntoVaultConfig: BaseMethodConfig<
    ClosePositionIntoVaultArgs,
    ClosePositionIntoVaultAccounts,
    ClosePositionIntoVaultInstructionAccounts
> = {
    process: async (
        config: ConfigArgs<ClosePositionIntoVaultArgs, ClosePositionIntoVaultAccounts>
    ) => {
        const args = validateArgs(config.args);
        const mintCache = validateMintCache(config.mintCache);
        const { hops, data, remainingAccounts } = extractInstructionData(args.instructions);

        const poolAccount = await findPoolCached(config.program, config.accounts.pool);

        if (!poolAccount) {
            throw new Error('Pool does not exist');
        }

        const [
            {
                ownerPayoutAta,
                setupIx,
                cleanupIx,
                currencyTokenProgram,
                collateralTokenProgram,
                payoutMint
            },
            orderIxes
        ] = await Promise.all([
            handleCloseTokenAccounts(
                {
                    program: config.program,
                    owner: config.accounts.owner,
                    mintCache
                },
                poolAccount
            ),
            handleOrdersCheck(
                config.program,
                config.accounts.position,
                'MARKET',
                Number(args.amount)
            )
        ]);

        if (!ownerPayoutAta) {
            throw new Error('Owner payout account does not exist');
        }

        // The deposit vault is derived from the payout mint:
        //   LONG  → payout is currency  → deposit into currency LP vault (same as close lpVault)
        //   SHORT → payout is collateral → deposit into collateral LP vault
        const payoutTokenProgram = poolAccount.isLongPool
            ? currencyTokenProgram
            : collateralTokenProgram;

        const depositLpVault = PDA.getLpVault(payoutMint);
        const depositVault = getAssociatedTokenAddressSync(
            payoutMint,
            depositLpVault,
            true,
            payoutTokenProgram
        );
        const sharesMint = PDA.getSharesMint(depositLpVault, payoutMint);

        const ownerSharesAccount = getAssociatedTokenAddressSync(
            sharesMint,
            config.accounts.owner,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const setup: TransactionInstruction[] = [...orderIxes, ...setupIx];

        // Create the shares token account if it does not yet exist
        const sharesAccountInfo = await config.program.provider.connection.getAccountInfo(
            ownerSharesAccount
        );
        if (!sharesAccountInfo) {
            setup.push(
                createAssociatedTokenAccountInstruction(
                    config.accounts.owner,
                    ownerSharesAccount,
                    config.accounts.owner,
                    sharesMint,
                    TOKEN_2022_PROGRAM_ID
                )
            );
        }

        const closeLpVault = PDA.getLpVault(poolAccount.currency);
        const excessTokenPurchaser = PDA.getExcessTokenPurchaser();

        const excessTokenPurchaserCurrencyVault = getAssociatedTokenAddressSync(
            poolAccount.currency,
            excessTokenPurchaser,
            true,
            currencyTokenProgram
        );

        const excessTokenPurchaserCollateralVault = getAssociatedTokenAddressSync(
            poolAccount.collateral,
            excessTokenPurchaser,
            true,
            collateralTokenProgram
        );

        return {
            accounts: {
                deposit: {
                    owner: config.accounts.owner,
                    ownerAssetAccount: ownerPayoutAta,
                    ownerSharesAccount,
                    lpVault: depositLpVault,
                    vault: depositVault,
                    assetMint: payoutMint,
                    sharesMint,
                    globalSettings: PDA.getGlobalSettings(),
                    assetTokenProgram: payoutTokenProgram,
                    sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
                    eventAuthority: PDA.getEventAuthority(),
                    program: WASABI_PROGRAM_ID
                },
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount: ownerPayoutAta,
                    lpVault: closeLpVault,
                    vault: getAssociatedTokenAddressSync(
                        poolAccount.currency,
                        closeLpVault,
                        true,
                        currencyTokenProgram
                    ),
                    pool: config.accounts.pool,
                    currencyVault: poolAccount.currencyVault,
                    collateralVault: poolAccount.collateralVault,
                    currency: poolAccount.currency,
                    collateral: poolAccount.collateral,
                    position: config.accounts.position,
                    authority: config.accounts.authority,
                    permission: PDA.getAdmin(config.accounts.authority),
                    feeWallet: config.accounts.feeWallet,
                    liquidationWallet: config.accounts.liquidationWallet,
                    debtController: PDA.getDebtController(),
                    globalSettings: PDA.getGlobalSettings(),
                    excessTokenPurchaser,
                    excessTokenPurchaserCurrencyVault,
                    excessTokenPurchaserCollateralVault,
                    currencyTokenProgram,
                    collateralTokenProgram,
                    systemProgram: SystemProgram.programId
                }
            },
            args: {
                ...config.args,
                hops,
                data
            },
            setup,
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.closePositionIntoVault(
            new BN(args.amount.toString()),
            new BN(args.minTargetAmount.toString()),
            new BN(args.interest.toString()),
            new BN(args.executionFee.toString()),
            new BN(args.expiration.toString()),
            { hops: args.hops },
            args.data
        )
};

export async function createClosePositionIntoVaultInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionIntoVaultArgs,
    accounts: ClosePositionIntoVaultAccounts,
    mintCache?: TokenMintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closePositionIntoVaultConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
