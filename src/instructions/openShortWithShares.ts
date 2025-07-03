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

        const borrowLpVault = PDA.getLpVault(config.accounts.currency);
        const borrowVault = getAssociatedTokenAddressSync(
            config.accounts.currency,
            borrowLpVault,
            true,
            currencyTokenProgram
        );
        const withdrawLpVault = PDA.getLpVault(config.accounts.collateral);
        const withdrawVault = getAssociatedTokenAddressSync(
            config.accounts.collateral,
            withdrawLpVault,
            true,
            collateralTokenProgram
        );
        const sharesMint = PDA.getSharesMint(withdrawLpVault, config.accounts.collateral);
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
                    lpVault: withdrawLpVault,
                    vault: withdrawVault,
                    assetMint: config.accounts.collateral,
                    sharesMint,
                    globalSettings,
                    assetTokenProgram: collateralTokenProgram,
                    sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
                    eventAuthority: PDA.getEventAuthority(),
                    program: config.program.programId
                },
                openShortPosition: {
                    owner: config.accounts.owner,
                    ownerTargetCurrencyAccount: ownerPaymentAta,
                    lpVault: borrowLpVault,
                    vault: borrowVault,
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
                    position: PDA.getPosition(
                        config.accounts.owner,
                        pool,
                        borrowLpVault,
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
