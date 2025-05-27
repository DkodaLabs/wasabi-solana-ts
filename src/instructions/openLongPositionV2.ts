import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { extractInstructionData } from './shared';
import { getTokenProgram, PDA } from '../utils';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction, createSyncNativeInstruction,
    getAssociatedTokenAddressSync,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';

export type OpenLongPositionInstructionAccounts = {
    owner: PublicKey;
    ownerCurrencyAccount: PublicKey;
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
    tokenProgram: PublicKey;
    systemProgram: PublicKey;
};

const openLongPositionConfig: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenLongPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const accountsToFetch = [config.accounts.currency, config.accounts.collateral];

        let setupIx: TransactionInstruction[] = [];

        if (config.accounts.currency.equals(NATIVE_MINT)) {
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

        const tokenProgram = fetchedAccounts[0].owner;
        const collateralTokenProgram = fetchedAccounts[1].owner;
        const ownerCurrencyAccount = fetchedAccounts[2]
            ? getAssociatedTokenAddressSync(
                  NATIVE_MINT,
                  config.accounts.owner,
                  false,
                  TOKEN_PROGRAM_ID
              )
            : getAssociatedTokenAddressSync(
                  config.accounts.currency,
                  config.accounts.owner,
                  false,
                  tokenProgram
              );

        const cleanupIx: TransactionInstruction[] = [];

        if (!fetchedAccounts[2]) {
            setupIx = [
                createAssociatedTokenAccountIdempotentInstruction(
                    config.accounts.owner,
                    ownerCurrencyAccount,
                    config.accounts.owner,
                    NATIVE_MINT,
                    TOKEN_PROGRAM_ID,
                ),
                ...setupIx
            ];
            cleanupIx.push(
                createCloseAccountInstruction(
                    ownerCurrencyAccount,
                    config.accounts.owner,
                    config.accounts.owner,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );
        }

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getLongPool(config.accounts.collateral, config.accounts.currency);

        if (!config.args.nonce) {
            throw new Error('Nonce is required for `OpenLongPosition`');
        }

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount,
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    lpVault,
                    true,
                    tokenProgram
                ),
                pool,
                currencyVault: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    pool,
                    true,
                    tokenProgram
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
                tokenProgram,
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
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
        program.methods.openLongPosition(
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

export async function createOpenLongPositionInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
