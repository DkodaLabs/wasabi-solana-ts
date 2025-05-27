import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { extractInstructionData } from './shared';
import { getTokenProgram, PDA } from '../utils';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction,
    createSyncNativeInstruction,
    getAssociatedTokenAddressSync,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';

export type OpenShortPositionInstructionAccounts = {
    owner: PublicKey;
    ownerTargetCurrencyAccount: PublicKey;
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
    debtController: PublicKey;
    globalSettings: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    systemProgram: PublicKey;
};

const openShortPositionConfig: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenShortPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const accountsToFetch = [config.accounts.currency, config.accounts.collateral];

        let setupIx: TransactionInstruction[] = [];

        if (config.accounts.collateral.equals(NATIVE_MINT)) {
            const ownerWrapped = getAssociatedTokenAddressSync(
                NATIVE_MINT,
                config.accounts.owner,
                false,
                TOKEN_PROGRAM_ID
            );

            accountsToFetch.push(ownerWrapped);

            setupIx.push(
                SystemProgram.transfer({
                    fromPubkey: config.accounts.owner,
                    toPubkey: ownerWrapped,
                    lamports: Number(config.args.downPayment) + Number(config.args.fee)
                })
            );

            setupIx.push(createSyncNativeInstruction(ownerWrapped, TOKEN_PROGRAM_ID));
        }

        const fetchedAccounts = await config.program.provider.connection.getMultipleAccountsInfo(
            accountsToFetch
        );

        const currencyTokenProgram = fetchedAccounts[0].owner;
        const collateralTokenProgram = fetchedAccounts[1].owner;
        const ownerPaymentCurrencyAccount = fetchedAccounts[2]
            ? getAssociatedTokenAddressSync(
                  NATIVE_MINT,
                  config.accounts.owner,
                  false,
                  TOKEN_PROGRAM_ID
              )
            : getAssociatedTokenAddressSync(
                  config.accounts.collateral,
                  config.accounts.owner,
                  false,
                  collateralTokenProgram
              );

        const cleanupIx: TransactionInstruction[] = [];

        if (!fetchedAccounts[2]) {
            setupIx = [
                createAssociatedTokenAccountIdempotentInstruction(
                    config.accounts.owner,
                    ownerPaymentCurrencyAccount,
                    config.accounts.owner,
                    NATIVE_MINT,
                    TOKEN_PROGRAM_ID
                ),
                ...setupIx
            ];
            cleanupIx.push(
                createCloseAccountInstruction(
                    ownerPaymentCurrencyAccount,
                    config.accounts.owner,
                    config.accounts.owner,
                    [],
                    collateralTokenProgram
                )
            );
        }

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getShortPool(config.accounts.collateral, config.accounts.currency);

        if (!config.args.nonce) {
            throw new Error('Nonce is required for `OpenLongPosition`');
        }

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerTargetCurrencyAccount: getAssociatedTokenAddressSync(
                    config.accounts.collateral,
                    config.accounts.owner,
                    false,
                    collateralTokenProgram
                ),
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
        program.methods.openShortPosition(
            args.nonce || 0,
            new BN(args.minTargetAmount),
            new BN(args.downPayment),
            new BN(args.principal),
            new BN(args.fee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createOpenShortPositionInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openShortPositionConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
