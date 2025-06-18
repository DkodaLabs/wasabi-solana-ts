import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { BN, Program } from '@coral-xyz/anchor';
import { extractInstructionData } from './shared';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';
import { WasabiSolana } from '../idl';
import { SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';

const openShortVaultShares: BaseMethodConfig<> = {
    process: async (config: ConfigArgs<>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const lpVault = PDA.getLpVault(config.acounts.currency);
        const pool = PDA.getShortPool(config.accounts.collateral, config.accounts.currency);

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

        return {
            accounts: {
                withdraw: {},
                openShortPosition: {
                    owner: config.accounts.owner,
                    ownerTargetCurrencyAccount: ownerPaymentAta,
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
                    position: PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce),
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
    getMethod: (program) => (args) => program.methods.openShortPositionWithVaultShares(
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

export async function createOpenShortVaultSharesInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openShortVaultShares,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}