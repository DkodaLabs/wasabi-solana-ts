import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY, PublicKey,
    AccountMeta
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    PDA,
    handleMintsAndTokenProgram,
    getPermission, handlePaymentTokenMint,
    createWrapSolInstruction,
    getTokenProgram
} from '../utils';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall
} from '../base';
import {
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts, OpenPositionSetupInstructionBaseAccounts
} from './openPosition';
import { WasabiSolana } from '../idl/wasabi_solana';

type OpenLongPositionSetupInstructionAccounts = {
    ownerCollateralAccount: PublicKey;
    openPositionRequest: PublicKey;
    debtController: PublicKey;
    tokenProgram: PublicKey;
} & OpenPositionSetupInstructionBaseAccounts;

const openLongPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenLongPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>) => {
        const result = await handlePaymentTokenMint(
            config.program.provider.connection,
            config.accounts.owner,
            config.accounts.currency, // payment token mint
            config.accounts.currency,
            config.accounts.collateral,
            'wrap',
            Number(config.args.downPayment) + Number(config.args.fee)
        );
        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx
        } = result;
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getLongPool(collateralMint, currencyMint);

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.owner,
                    false,
                    currencyTokenProgram
                ),
                ownerCollateralAccount: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.owner,
                    false,
                    collateralTokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    currencyMint,
                    lpVault,
                    true,
                    currencyTokenProgram
                ),
                pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    pool,
                    true,
                    currencyTokenProgram
                ),
                currency: currencyMint,
                collateral: collateralMint,
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position: PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce),
                authority: config.program.provider.publicKey,
                permission: await getPermission(config.program, config.program.provider.publicKey),
                feeWallet: config.accounts.feeWallet,
                feeWalletAta: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.feeWallet,
                    true,
                    currencyTokenProgram
                ),
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                tokenProgram: currencyTokenProgram,
                systemProgram: SystemProgram.programId,
                sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
            },
            args: {
                nonce: config.args.nonce,
                minTargetAmount: new BN(config.args.minTargetAmount),
                downPayment: new BN(config.args.downPayment),
                principal: new BN(config.args.principal),
                fee: new BN(config.args.fee),
                expiration: new BN(config.args.expiration)
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.openLongPositionSetup(
            args.nonce,
            args.minTargetAmount,
            args.downPayment,
            args.principal,
            args.fee,
            args.expiration
        )
};

const openLongPositionCleanupConfig: BaseMethodConfig<
    void,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, OpenPositionCleanupAccounts>) => {
        const { currencyMint, collateralMint, currencyTokenProgram, collateralTokenProgram } =
            await handleMintsAndTokenProgram(
                config.program.provider.connection,
                config.accounts.currency,
                config.accounts.collateral,
                config.accounts.pool
            );

        return {
            accounts: {
                owner: config.accounts.owner,
                pool: config.accounts.pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.pool,
                    true,
                    currencyTokenProgram
                ),
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position: config.accounts.position,
                tokenProgram: currencyTokenProgram
            }
        };
    },
    getMethod: (program) => () => program.methods.openLongPositionCleanup()
};

export async function createOpenLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionSetupArgs,
    accounts: OpenPositionSetupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionSetupConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}

export async function createOpenLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongPositionCleanupConfig
    }) as Promise<TransactionInstruction[]>;
}

export type Hop = {
    programId: PublicKey,
    dataStartIdx: number,
    dataSize: number,
    accountStartIdx: number,
    accountSize: number,
};

export type OpenPositionArgs = {
    nonce?: number,
    positionId?: string,
    minTargetAmount: number | bigint,
    downPayment: number | bigint,
    principal: number | bigint,
    fee: number | bigint,
    expiration: number | bigint,
    instructions: TransactionInstruction[],
}
export type OpenPositionAccounts = {
    owner: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    authority: PublicKey,
    feeWallet: PublicKey,
};

export type OpenPositionInstructionAccounts = {
    owner: PublicKey,
    ownerCurrencyAccount: PublicKey,
    lpVault: PublicKey,
    vault: PublicKey,
    pool: PublicKey,
    currencyVault: PublicKey,
    collateralVault: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    authority: PublicKey,
    permission: PublicKey,
    feeWallet: PublicKey,
    debtController: PublicKey,
    globalSettings: PublicKey,
    tokenProgram: PublicKey,
    systemProgram: PublicKey,
};

const openLongPositionConfig: BaseMethodConfig<OpenPositionArgs, OpenPositionAccounts, OpenPositionInstructionAccounts> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        let accountIdx = 0;
        let dataIdx = 0;
        let data = Buffer.alloc(0);

        const hops = [];
        const remainingAccounts = [];

        for (const ix of config.args.instructions) {
            const hop: Hop = {
                programId: ix.programId,
                dataStartIdx: dataIdx,
                dataSize: ix.data.length,
                accountStartIdx: accountIdx + 1,
                accountSize: ix.keys.length
            };

            const programAccount: AccountMeta = {
                pubkey: ix.programId,
                isSigner: false,
                isWritable: false
            };

            hops.push(hop);
            data = Buffer.concat([data, ix.data]);
            dataIdx += ix.data.length;
            accountIdx += ix.keys.length;
            remainingAccounts.push(programAccount, ...ix.keys);
        }

        const [wSolIx, tokenProgram, collateralTokenProgram] = await Promise.all([
            createWrapSolInstruction(
                config.program.provider.connection,
                config.accounts.owner,
                (config.args.downPayment as bigint) + (config.args.fee as bigint),
                false
            ),
            getTokenProgram(config.program.provider.connection, config.accounts.currency),
            getTokenProgram(config.program.provider.connection, config.accounts.collateral)
        ]);

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getLongPool(config.accounts.collateral, config.accounts.currency);

        if (!config.args.nonce) {
            throw new Error('Nonce is required for `OpenLongPosition`');
        }

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    config.accounts.owner,
                    false,
                    tokenProgram
                ),
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
                authority: config.accounts.authority,
                permission: PDA.getAdmin(config.accounts.authority),
                feeWallet: config.accounts.feeWallet,
                tokenProgram,
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                systemProgram: SystemProgram.programId,
            },
            args: {
                ...config.args,
                hops,
                data,
            },
            remainingAccounts,
            setup: wSolIx.setupIx,
        };
    },
    getMethod: (program) => (args) => program.methods.openLongPosition(
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