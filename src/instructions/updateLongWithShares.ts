import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { extractInstructionData } from './shared';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';
import { TokenInstructionAccounts } from './tokenAccounts';
import { handleOrdersCheck } from './closePosition';

type UpdateLongWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    updateLongPosition: OpenLongPositionInstructionAccounts;
};

const updateLongWithShares: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    UpdateLongWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getLongPool(config.accounts.collateral, config.accounts.currency);

        if (!config.args.positionId) {
            throw new Error('positionId is required for `UpdateLongWithShares`');
        }

        const position = new PublicKey(config.args.positionId);
        const [
            { ownerPaymentAta, currencyTokenProgram, collateralTokenProgram, setupIx, cleanupIx },
            orderIxes
        ] = await Promise.all([
            handleOpenTokenAccounts({
                program: config.program,
                owner: config.accounts.owner,
                downPayment: config.args.downPayment,
                fee: config.args.fee,
                mintCache: config.mintCache,
                isLongPool: true,
                currency: config.accounts.currency,
                collateral: config.accounts.collateral
            }),
            handleOrdersCheck(config.program, position, 'MARKET')
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
                updateLongPosition: {
                    owner: config.accounts.owner,
                    ownerCurrencyAccount: ownerPaymentAta,
                    lpVault,
                    vault: getAssociatedTokenAddressSync(
                        config.accounts.currency,
                        lpVault,
                        true,
                        currencyTokenProgram
                    ),
                    pool,
                    currencyVault: getAssociatedTokenAddressSync(
                        config.accounts.currency,
                        pool,
                        true,
                        currencyTokenProgram
                    ),
                    collateralVault: getAssociatedTokenAddressSync(
                        config.accounts.collateral,
                        pool,
                        true,
                        collateralTokenProgram
                    ),
                    currency: config.accounts.currency,
                    collateral: config.accounts.collateral,
                    position,
                    authority: config.accounts.authority,
                    permission: PDA.getAdmin(config.accounts.authority),
                    feeWallet: config.accounts.feeWallet,
                    tokenProgram: currencyTokenProgram,
                    debtController: PDA.getDebtController(),
                    globalSettings: PDA.getGlobalSettings(),
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
        program.methods.updateLongPositionWithShares(
            args.withdrawAmount,
            new BN(args.minTargetAmount),
            new BN(args.downPayment),
            new BN(args.principal),
            new BN(args.fee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createUpdateLongWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: updateLongWithShares,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}