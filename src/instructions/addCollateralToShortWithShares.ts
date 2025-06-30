import { Program, BN } from '@coral-xyz/anchor';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { handleOrdersCheck } from './closePosition';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { TokenInstructionAccounts } from './tokenAccounts';

export type AddCollateralWithSharesArgs = {
    withdrawAmount: number;
    downPayment: number;
    fee: number;
    expiration: number;
};

export type AddCollateralWithSharesAccounts = {
    owner: PublicKey;
    position: PublicKey;
    currency: PublicKey;
    feeWallet: PublicKey;
};

type AddCollateralToShortWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    addCollateral: {
        owner: PublicKey;
        ownerTargetCurrencyAccount: PublicKey;
        position: PublicKey;
        pool: PublicKey;
        collateralVault: PublicKey;
        collateral: PublicKey;
        feeWallet: PublicKey;
        globalSettings: PublicKey;
        collateralTokenProgram: PublicKey;
    };
};

const addCollateralToShortWithSharesConfig: BaseMethodConfig<
    AddCollateralWithSharesArgs,
    AddCollateralWithSharesAccounts,
    AddCollateralToShortWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<AddCollateralWithSharesArgs, AddCollateralWithSharesAccounts>) => {
        const position = await config.program.account.position.fetchNullable(
            config.accounts.position
        );
        if (!position) throw new Error('Position not found');

        const pool = PDA.getShortPool(position.collateral, position.currency);
        const lpVault = PDA.getLpVault(config.accounts.currency);

        const [
            {
                ownerPaymentAta,
                setupIx,
                cleanupIx,
                currencyTokenProgram,
                collateralTokenProgram
            },
            orderIxes
        ] = await Promise.all([
            handleOpenTokenAccounts({
                program: config.program,
                owner: config.accounts.owner,
                mintCache: config.mintCache,
                downPayment: config.args.downPayment,
                fee: config.args.fee,
                currency: position.currency,
                collateral: position.collateral,
                isLongPool: false
            }),
            handleOrdersCheck(config.program, config.accounts.position, 'MARKET')
        ]);

        const vault = getAssociatedTokenAddressSync(
            config.accounts.currency,
            lpVault,
            true,
            currencyTokenProgram
        );
        const sharesMint = PDA.getSharesMint(lpVault, config.accounts.currency);
        const globalSettings = PDA.getGlobalSettings();

        return {
            accounts: {
                withdraw: {
                    owner: config.accounts.owner,
                    ownerAssetAccount: ownerPaymentAta,
                    ownerSharesAccount: getAssociatedTokenAddressSync(
                        sharesMint,
                        config.accounts.owner,
                        false,
                        TOKEN_2022_PROGRAM_ID
                    ),
                    lpVault,
                    vault,
                    assetMint: config.accounts.currency,
                    sharesMint,
                    globalSettings,
                    assetTokenProgram: currencyTokenProgram,
                    sharesTokenProgram: TOKEN_2022_PROGRAM_ID
                },
                addCollateral: {
                    owner: config.accounts.owner,
                    ownerTargetCurrencyAccount: ownerPaymentAta,
                    position: config.accounts.position,
                    pool,
                    collateralVault: position.collateralVault,
                    collateral: position.collateral,
                    feeWallet: config.accounts.feeWallet,
                    globalSettings,
                    collateralTokenProgram
                }
            },
            args: {
                withdrawAmount: config.args.withdrawAmount,
                downPayment: config.args.downPayment,
                feesToPaid: config.args.fee,
                expiration: config.args.expiration
            },
            setup: [...orderIxes, ...setupIx],
            cleanup: cleanupIx,
        };
    },
    getMethod: (program) => (args) =>
        program.methods.addCollateralToShortWithShares(
            new BN(args.withdrawAmount),
            new BN(args.downPayment),
            new BN(args.feesToPaid),
            new BN(args.expiration)
        )
};

export async function createAddCollateralToShortWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: AddCollateralWithSharesArgs,
    accounts: AddCollateralWithSharesAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: addCollateralToShortWithSharesConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}