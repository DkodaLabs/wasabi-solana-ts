import { Program, BN } from '@coral-xyz/anchor';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl';
import { TransactionInstruction } from '@solana/web3.js';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';
import {
    AddCollateralAccounts,
    AddCollateralArgs,
    AddCollateralInstructionAccounts
} from './addCollateralToShortPosition';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { TokenInstructionAccounts } from './tokenAccounts';

type AddCollateralWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    addCollateral: AddCollateralInstructionAccounts;
};

const addCollateralWithSharesConfig: BaseMethodConfig<
    AddCollateralArgs,
    AddCollateralAccounts,
    AddCollateralWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>) => {
        const position = await config.program.account.position.fetchNullable(
            config.accounts.position
        );
        if (!position) throw new Error('Position not found');

        const pool = PDA.getShortPool(position.collateral, position.currency);

        const { ownerPaymentAta, setupIx, cleanupIx, collateralTokenProgram } =
            await handleOpenTokenAccounts({
                program: config.program,
                owner: config.accounts.owner,
                mintCache: config.mintCache,
                downPayment: config.args.downPayment,
                fee: config.args.fee,
                currency: position.currency,
                collateral: position.collateral,
                isLongPool: false,
                useShares: false
            });

        const lpVault = PDA.getLpVault(position.collateral);
        const vault = getAssociatedTokenAddressSync(
            position.collateral,
            lpVault,
            true,
            collateralTokenProgram
        );
        const sharesMint = PDA.getSharesMint(lpVault, position.collateral);
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
                    assetMint: position.collateral,
                    sharesMint,
                    globalSettings,
                    assetTokenProgram: collateralTokenProgram,
                    sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
                    eventAuthority: PDA.getEventAuthority(),
                    program: config.program.programId
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
                downPayment: config.args.downPayment,
                feesToPaid: config.args.fee,
                expiration: config.args.expiration
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.addCollateralToShortWithShares(
            new BN(args.downPayment),
            new BN(args.feesToPaid),
            new BN(args.expiration)
        )
};

export async function createAddCollateralToShortWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: AddCollateralArgs,
    accounts: AddCollateralAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: addCollateralWithSharesConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
