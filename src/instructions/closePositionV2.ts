import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { WasabiSolana } from '../idl';
import { BN, Program } from '@coral-xyz/anchor';
import { handleCloseTokenAccounts, PDA, validateArgs, validateMintCache } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { extractInstructionData } from './shared';
import { handleOrdersCheck } from './closePosition';
import {TokenMintCache} from "../cache/TokenMintCache";

export type ClosePositionArgs = {
    amount: number | bigint;
    minTargetAmount: number | bigint;
    interest: number | bigint;
    executionFee: number | bigint;
    expiration: number | bigint;
    instructions: TransactionInstruction[];
};

export type ClosePositionAccounts = {
    owner: PublicKey;
    authority: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    feeWallet: PublicKey;
    liquidationWallet: PublicKey;
};

export type ClosePositionInstructionAccounts = {
    owner: PublicKey;
    closePosition: ClosePositionInternalInstructionAccounts;
};

export type ClosePositionInternalInstructionAccounts = {
    owner: PublicKey;
    ownerPayoutAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    currencyVault: PublicKey;
    collateralVault: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    position: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    liquidationWallet: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    excessTokenPurchaser: PublicKey;
    excessTokenPurchaserCurrencyVault: PublicKey;
    excessTokenPurchaserCollateralVault: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    systemProgram: PublicKey;
};

const closePostionConfig: BaseMethodConfig<
    ClosePositionArgs,
    ClosePositionAccounts,
    ClosePositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionArgs, ClosePositionAccounts>) => {
        const args = validateArgs(config.args);
        const mintCache = validateMintCache(config.mintCache);
        const { hops, data, remainingAccounts } = extractInstructionData(args.instructions);

        const poolAccount = await config.program.account.basePool.fetchNullable(
            config.accounts.pool
        );

        if (!poolAccount) {
            throw new Error('Pool does not exist');
        }

        const [
            { ownerPayoutAta, setupIx, cleanupIx, currencyTokenProgram, collateralTokenProgram },
            orderIxes
        ] = await Promise.all([
            handleCloseTokenAccounts(
                {
                    program: config.program,
                    owner: config.accounts.owner,
                    mintCache,
                },
                poolAccount
            ),
            handleOrdersCheck(config.program, config.accounts.position, 'MARKET', Number(args.amount))
        ]);

        const lpVault = PDA.getLpVault(poolAccount.currency);

        if (!ownerPayoutAta) {
            throw new Error('Owner payout account does not exist');
        }

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
                owner: config.accounts.owner,
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount: ownerPayoutAta,
                    lpVault,
                    vault: getAssociatedTokenAddressSync(
                        poolAccount.currency,
                        lpVault,
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
            setup: [...orderIxes, ...setupIx],
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.closePosition(
            new BN(args.amount),
            new BN(args.minTargetAmount),
            new BN(args.interest),
            new BN(args.executionFee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createClosePositionInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionArgs,
    accounts: ClosePositionAccounts,
    mintCache?: TokenMintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: closePostionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
