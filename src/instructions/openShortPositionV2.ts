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

        let setupIx: TransactionInstruction[] = [];
        const cleanupIx: TransactionInstruction[] = [];

        let ownerCollateralAta: PublicKey | undefined = undefined;
        let fetchOwnerCollateralAtaPromise: Promise<any> | undefined = undefined;

        const collateralIsSol = config.accounts.collateral.equals(NATIVE_MINT);
        if (collateralIsSol) {
            ownerCollateralAta = getAssociatedTokenAddressSync(
                NATIVE_MINT,
                config.accounts.owner,
                false,
                TOKEN_PROGRAM_ID
            );

            setupIx.push(
                SystemProgram.transfer({
                    fromPubkey: config.accounts.owner,
                    toPubkey: ownerCollateralAta,
                    lamports: Number(config.args.downPayment) + Number(config.args.fee)
                })
            );

            setupIx.push(createSyncNativeInstruction(ownerCollateralAta, TOKEN_PROGRAM_ID));

            fetchOwnerCollateralAtaPromise =
                config.program.provider.connection.getAccountInfo(ownerCollateralAta);
        }

        const promises: Promise<any>[] = [
            config.mintCache.getMintInfos([config.accounts.currency, config.accounts.collateral])
        ];

        if (fetchOwnerCollateralAtaPromise) {
            promises.push(fetchOwnerCollateralAtaPromise);
        }

        const results = await Promise.all(promises);
        const mints = results[0];
        const ownerCollateralAtaInfo = results.length > 1 ? results[1] : null;

        const currencyTokenProgram = mints.get(config.accounts.currency).owner;
        const collateralTokenProgram = mints.get(config.accounts.collateral).owner;

        if (collateralIsSol && ownerCollateralAta && !ownerCollateralAtaInfo) {
            setupIx = [
                createAssociatedTokenAccountIdempotentInstruction(
                    config.accounts.owner,
                    ownerCollateralAta,
                    config.accounts.owner,
                    NATIVE_MINT,
                    TOKEN_PROGRAM_ID
                ),
                ...setupIx
            ];
            cleanupIx.push(
                createCloseAccountInstruction(
                    ownerCollateralAta,
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
                ownerTargetCurrencyAccount: ownerCollateralAta ?? getAssociatedTokenAddressSync(
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
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openShortPositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
