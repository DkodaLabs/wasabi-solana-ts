import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { extractInstructionData } from './shared';
import { MintCache, PDA } from '../utils';
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

        let setupIx: TransactionInstruction[] = [];
        const cleanupIx: TransactionInstruction[] = [];

        let ownerCurrencyAta: PublicKey | undefined = undefined;
        let fetchOwnerCurrencyAtaPromise: Promise<any> | undefined = undefined;

        const currencyIsSol = config.accounts.currency.equals(NATIVE_MINT);
        if (currencyIsSol) {
            ownerCurrencyAta = getAssociatedTokenAddressSync(
                NATIVE_MINT,
                config.accounts.owner,
                false,
                TOKEN_PROGRAM_ID
            );

            setupIx.push(
                SystemProgram.transfer({
                    fromPubkey: config.accounts.owner,
                    toPubkey: ownerCurrencyAta,
                    lamports: Number(config.args.downPayment) + Number(config.args.fee)
                })
            );

            setupIx.push(createSyncNativeInstruction(ownerCurrencyAta, TOKEN_PROGRAM_ID));

            fetchOwnerCurrencyAtaPromise =
                config.program.provider.connection.getAccountInfo(ownerCurrencyAta);
        }

        const promises: Promise<any>[] = [
            config.mintCache.getMintInfos([config.accounts.currency, config.accounts.collateral])
        ];

        if (fetchOwnerCurrencyAtaPromise) {
            promises.push(fetchOwnerCurrencyAtaPromise);
        }

        const results = await Promise.all(promises);
        const mints = results[0] as Array<{ owner: PublicKey }>;
        const ownerCurrencyAtaInfo = results.length > 1 ? results[1] : null;

        const tokenProgram = mints[0].owner;
        const collateralTokenProgram = mints[1].owner;

        if (currencyIsSol && ownerCurrencyAta && !ownerCurrencyAtaInfo) {
            setupIx = [
                createAssociatedTokenAccountIdempotentInstruction(
                    config.accounts.owner,
                    ownerCurrencyAta,
                    config.accounts.owner,
                    NATIVE_MINT,
                    TOKEN_PROGRAM_ID
                ),
                ...setupIx
            ];
            cleanupIx.push(
                createCloseAccountInstruction(
                    ownerCurrencyAta,
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
                ownerCurrencyAccount: ownerCurrencyAta,
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
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
