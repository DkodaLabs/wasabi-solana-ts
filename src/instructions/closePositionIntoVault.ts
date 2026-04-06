import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { WasabiSolana } from '../idl';
import { BN, Program } from '@coral-xyz/anchor';
import { PDA, validateArgs, validateMintCache } from '../utils';
import {
    TOKEN_2022_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync
} from '@solana/spl-token';
import { extractInstructionData } from './shared';
import { handleOrdersCheck } from './closePosition';
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
};

type ClosePositionIntoVaultInstructionAccounts = {
    owner: PublicKey;
    position: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    currencyVault: PublicKey;
    collateralVault: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    excessTokenPurchaser: PublicKey;
    excessTokenPurchaserCurrencyVault: PublicKey;
    excessTokenPurchaserCollateralVault: PublicKey;
    payoutLpVault: PublicKey;
    payoutVault: PublicKey;
    ownerSharesAccount: PublicKey;
    sharesMint: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    sharesTokenProgram: PublicKey;
    systemProgram: PublicKey;
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

        const [mints, orderIxes] = await Promise.all([
            mintCache.getAccounts([poolAccount.currency, poolAccount.collateral]),
            handleOrdersCheck(
                config.program,
                config.accounts.position,
                'MARKET',
                Number(args.amount)
            )
        ]);

        const currencyTokenProgram = mints.get(poolAccount.currency.toString()).program;
        const collateralTokenProgram = mints.get(poolAccount.collateral.toString()).program;

        // LP vault borrowed by the position (LONG: currency vault, SHORT: base vault)
        const lpVault = PDA.getLpVault(poolAccount.currency);
        const vault = getAssociatedTokenAddressSync(
            poolAccount.currency,
            lpVault,
            true,
            currencyTokenProgram
        );

        // Payout destination LP vault and vault token account
        // LONG: payout=currency -> same vault as lpVault
        // SHORT: payout=collateral -> collateral LP vault
        const payoutMint = poolAccount.isLongPool ? poolAccount.currency : poolAccount.collateral;
        const payoutTokenProgram = poolAccount.isLongPool
            ? currencyTokenProgram
            : collateralTokenProgram;
        const payoutLpVault = PDA.getLpVault(payoutMint);
        const payoutVault = getAssociatedTokenAddressSync(
            payoutMint,
            payoutLpVault,
            true,
            payoutTokenProgram
        );
        const sharesMint = PDA.getSharesMint(payoutLpVault, payoutMint);
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

        const ownerSharesAccount = getAssociatedTokenAddressSync(
            sharesMint,
            config.accounts.owner,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        const setup: TransactionInstruction[] = [...orderIxes];

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

        return {
            accounts: {
                owner: config.accounts.owner,
                position: config.accounts.position,
                lpVault,
                vault,
                pool: config.accounts.pool,
                currencyVault: poolAccount.currencyVault,
                collateralVault: poolAccount.collateralVault,
                currency: poolAccount.currency,
                collateral: poolAccount.collateral,
                authority: config.accounts.authority,
                permission: PDA.getAdmin(config.accounts.authority),
                feeWallet: config.accounts.feeWallet,
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                excessTokenPurchaser,
                excessTokenPurchaserCurrencyVault,
                excessTokenPurchaserCollateralVault,
                payoutLpVault,
                payoutVault,
                ownerSharesAccount,
                sharesMint,
                currencyTokenProgram,
                collateralTokenProgram,
                sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
                systemProgram: SystemProgram.programId
            },
            args: {
                ...config.args,
                hops,
                data
            },
            setup,
            cleanup: [],
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
