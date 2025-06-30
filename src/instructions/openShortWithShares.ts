import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { BN, Program } from '@coral-xyz/anchor';
import { extractInstructionData } from './shared';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';
import { WasabiSolana } from '../idl';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { OpenShortPositionInstructionAccounts } from './openShortPositionV2';
import { TokenInstructionAccounts } from './tokenAccounts';

type OpenShortWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    openShortPosition: OpenShortPositionInstructionAccounts;
};

const openShortWithShares: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenShortWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        // TODO: Handle the case where the payment currency is wrapped SOL
        // This is because we should create a wrapped SOL account for the user but neither
        // transfer from the user or sync nat

        const {
            ownerPaymentAta,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx
        } = await handleOpenTokenAccounts({
            program: config.program,
            owner: config.accounts.owner,
            downPayment: config.args.downPayment,
            fee: config.args.fee,
            mintCache: config.mintCache,
            isLongPool: false,
            currency: config.accounts.currency,
            collateral: config.accounts.collateral
        });

        if (!config.args.nonce) {
            throw new Error('Nonce is required for `OpenShortVaultShares`');
        }

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const vault = getAssociatedTokenAddressSync(
            config.accounts.currency,
            lpVault,
            true,
            currencyTokenProgram
        );
        const sharesMint = PDA.getSharesMint(lpVault, config.accounts.currency);
        const pool = PDA.getShortPool(config.accounts.collateral, config.accounts.currency);
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
                openShortPosition: {
                    owner: config.accounts.owner,
                    ownerTargetCurrencyAccount: ownerPaymentAta,
                    lpVault,
                    vault: pool,
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
                    position: PDA.getPosition(
                        config.accounts.owner,
                        pool,
                        lpVault,
                        config.args.nonce
                    ),
                    authority: config.accounts.authority,
                    permission: PDA.getAdmin(config.accounts.authority),
                    feeWallet: config.accounts.feeWallet,
                    debtController: PDA.getDebtController(),
                    globalSettings: PDA.getGlobalSettings(),
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
            setup: setupIx,
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.openShortWithShares(
            args.withdrawAmount,
            args.nonce,
            new BN(args.minTargetAmount),
            new BN(args.downPayment),
            new BN(args.principal),
            new BN(args.fee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createOpenShortWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openShortWithShares,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
