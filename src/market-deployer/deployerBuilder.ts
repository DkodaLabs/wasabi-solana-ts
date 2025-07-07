import { Program } from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountIdempotentInstruction,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { PDA, validateProviderPubkey } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    createInitLpVaultInstruction,
    createInitLongPoolInstruction,
    createInitShortPoolInstruction
} from '../instructions';
import { AddressLookupTableProgram } from '@solana/web3.js';
import { TransactionBuilder } from '../transaction-builder';
import { ComputeBudgetConfig } from '../compute-budget';

export const MAX_SERIALIZED_LEN = 1644;
export const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const WALLETS = {
    FEE: {
        // SOL
        So11111111111111111111111111111111111111112: [
            new PublicKey('HGj1D5gVkn3dj1PsvujMx85JYKyjfoxDytQAxehNBkva'),
            new PublicKey('4Y4TDNsWxpefR9oc44g5UND5mfyySWJFZiSKxmVDrTUa'),
            new PublicKey('9we3hSiFgWuCH6nQLfuQdceKdABMGGyVn8LgTdEPDP7'),
            new PublicKey('A6ecJ4juBMjBRLGZsTrJohm3AFes1rF5Hi3j3GMsUZa2'),
            new PublicKey('8U1m9X7n7qEppSfbghMCyWpspt8fT6sjTzGKTM9Bmupb')
        ],
        // USDC
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: [
            new PublicKey('J61ShfpvKaEZZSM97Avd96gx6oSd75yQ5MuPXoFW1x3t'),
            new PublicKey('5diZcJ27NxAqntbZHNkR1UaJaFcZp686uW2b8LVXizbp'),
            new PublicKey('EbHA4fbQMnPx2FXzuo16DwfvJXVRcDue7ogJXqHCMzJ6'),
            new PublicKey('5qPBmzE4D8dSQUnr2guUwJzvrVfR3PK4oyENa2NVvksF'),
            new PublicKey('bUph17KvUHD81iG3tHAUPPaaCZRQb8qJ8uNzKXKiHfA')
        ]
    },
    LIQUIDATION: {
        // SOL
        So11111111111111111111111111111111111111112: [
            new PublicKey('6JMSLsfYXLW2FovLeWHetRyZFeeRHgY2KwyMENP3UQjS'),
            new PublicKey('BKDcGdJkANDEYDtGgJj4RMLbXMq5eL7Na51JvQSJzwa9'),
            new PublicKey('3KVL8FU8pQFfebBcpuKosmHoJZp11AGzumXtDChgeC2G'),
            new PublicKey('D4LirVDAj9fDTSGYjmYpjpkAmwDigoQDpQs91Qi9FLnp'),
            new PublicKey('F9RKvHsqpvocUcWfX2pVcSoUAoLbggNfPA7M1cDc3XeG')
        ],
        // USDC
        EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: [
            new PublicKey('Ho9E91NxY9URfN37ny1dSBTcXvutWiK6HQRbX24ifsNg'),
            new PublicKey('2d7EPvJeffj9jFqrxU6j9y6TDGUKkwhgbDoDpYBjKtWd'),
            new PublicKey('4o7ZbfwgCGykbbYGXtZnAiUxRX5QkVMRxEgaekdCH76f'),
            new PublicKey('EgoukSymgjqwUxtzBGVaQjX6rtNCz1oCiSVEDPPw12m4'),
            new PublicKey('2rze3ZjXJpae178gB2tPdKyaUjAmZiqftdWgTkvJMg7K')
        ]
    }
};

/**
 * Represents the response returned by the Deployer.
 *
 * @property {PublicKey[]} pools - Array of public keys representing the pools.
 * @property {VersionedTransaction} [vaultTransaction] - Optional transaction for vault initialization.
 * @property {VersionedTransaction[]} marketTransactions - Array of transactions for markets: pools, lookup tables, and token accounts.
 * @property {PublicKey} [lookupTable] - Optional public key for the lookup table.
 *
 * Vault initialization is always in a separate bundle to market transactions.
 */
export interface DeployerResponse {
    pools: PublicKey[];
    vaultTransaction?: VersionedTransaction;
    marketTransactions: VersionedTransaction[];
    lookupTable?: PublicKey;
}

/**
 * Options available for configuring the Deployer.
 *
 * @property {boolean} [excludeLong] - Whether to exclude long pool creation.
 * @property {boolean} [excludeShort] - Whether to exclude short pool creation.
 * @property {boolean} [excludeLookups] - Whether to exclude lookup table creation.
 * @property {boolean} [excludeSol] - Whether to exclude SOL markets.
 * @property {boolean} [excludeUsdc] - Whether to exclude USDC markets.
 * @property {boolean} [excludeAta] - Whether to exclude associated token account creation.
 * @property {boolean} [excludeVault] - Whether to exclude vault creation.
 * @property {boolean} [onlyLookups] - Whether to only generate lookup table transactions.
 * @property {boolean} [onlyTokenAccounts] - Whether to only generate token account transactions.
 *
 * Example usages:
 * Vault only:
 * const options = {
 *     excludeLong: true,
 *     excludeShort: true,
 *     excludeLookups: true,
 * }
 *
 * Pools only:
 * const options = {
 *     excludeVault: true,
 *     excludeLookups: true,
 *     excludeAtas: true,
 * }
 *
 * Only lookup /w long addresses:
 * const options = {
 *     excludeShort: true,
 *     onlyLookup: true,
 * }
 *
 * Extend a long pool's lookup table with short pool addresses:
 * For example: If a long market has been initialized first and the short market later,
 * the short market's addresses need to be added to the current market lookup table.
 *
 * const options = {
 *     excludeLong: true,
 *     onlyLookup: true,
 * }
 * DeployerBuilder.setLookupTable(lookupTable);
 *
 * Setting the lookup table will instruct the builder that there is no need to initialize a new
 * lookup table, just extend the one provided.
 *
 * Only initialize a long USDC pool's wrapped sol token accounts:
 * const options = {
 *     excludeShort: true,
 *     onlyTokenAccounts: true
 * }
 */
export type DeployerOptions = {
    excludeLong?: boolean;
    excludeShort?: boolean;
    excludeLookups?: boolean;
    excludeSol?: boolean;
    excludeUsdc?: boolean;
    excludeAta?: boolean;
    excludeVault?: boolean;
    onlyLookups?: boolean;
    onlyTokenAccounts?: boolean;
};

export class DeployerBuilder {
    private mint!: PublicKey;
    private name!: string;
    private symbol!: string;
    private uri!: string;
    private program!: Program<WasabiSolana>;
    private swapAuthority?: PublicKey;
    private options: DeployerOptions = {};
    private computeBudget?: ComputeBudgetConfig;
    private lookupTable?: PublicKey;

    setMint(mint: PublicKey): this {
        this.mint = mint;
        return this;
    }

    setName(name: string): this {
        this.name = name;
        return this;
    }

    setSymbol(symbol: string): this {
        this.symbol = symbol;
        return this;
    }

    setUri(uri: string): this {
        this.uri = uri;
        return this;
    }

    setSwapAuthority(swapAuthority: PublicKey): this {
        this.swapAuthority = swapAuthority;
        return this;
    }

    setProgram(program: Program<WasabiSolana>): this {
        this.program = program;
        return this;
    }

    setExcludeLong(): this {
        this.options.excludeLong = true;
        return this;
    }

    setExcludeShort(): this {
        this.options.excludeShort = true;
        return this;
    }

    setExcludeLookups(): this {
        this.options.excludeLookups = true;
        return this;
    }

    setExcludeSol(): this {
        this.options.excludeSol = true;
        return this;
    }

    setExcludeUsdc(): this {
        this.options.excludeUsdc = true;
        return this;
    }

    setExcludeAta(): this {
        this.options.excludeAta = true;
        return this;
    }

    setExcludeVault(): this {
        this.options.excludeVault = true;
        return this;
    }

    setOnlyLookups(): this {
        this.options.onlyLookups = true;
        return this;
    }

    setOptions(options: Partial<DeployerOptions>): this {
        this.options = { ...this.options, ...options };
        return this;
    }

    setComputeBudget(computeBudget: ComputeBudgetConfig): this {
        this.computeBudget = computeBudget;
        return this;
    }

    setLookupTable(lookupTable: PublicKey): this {
        this.lookupTable = lookupTable;
        return this;
    }

    private validateRequiredFields(): void {
        if (!this.mint) throw new Error('Mint is required');
        if (!this.program) throw new Error('Program is required');

        if (!this.options.excludeVault && !this.options.onlyLookups) {
            if (!this.name) throw new Error('Name is required');
            if (!this.symbol) throw new Error('Symbol is required');
            if (!this.uri) throw new Error('URI is required');
        }
    }

    async build(): Promise<DeployerResponse> {
        this.validateRequiredFields();
        const payer = validateProviderPubkey(this.program.provider.publicKey);

        if (!this.computeBudget) {
            throw new Error('Compute budget is required');
        }

        const latestBlockhash = (await this.program.provider.connection.getLatestBlockhash())
            .blockhash;
        const builder = new TransactionBuilder()
            .setPayer(payer)
            .setConnection(this.program.provider.connection)
            .setComputeBudgetConfig(this.computeBudget)
            .setRecentBlockhash(latestBlockhash);

        const response = <DeployerResponse>{};

        const vaultIxes: TransactionInstruction[] = [];
        const longIxes: TransactionInstruction[] = [];
        const shortIxes: TransactionInstruction[] = [];
        const lookupIxes: TransactionInstruction[] = [];

        if (
            (!this.options.excludeSol ||
                !this.options.excludeUsdc ||
                !this.options.excludeLong ||
                !this.options.excludeShort) &&
            !this.options.onlyLookups &&
            !this.options.onlyTokenAccounts
        ) {
            const { pools, long, short } = await this.buildMarketInstructions();
            response.pools = pools;
            longIxes.push(...long);
            shortIxes.push(...short);
        }

        if (
            !this.options.excludeVault &&
            !this.options.onlyLookups &&
            !this.options.onlyTokenAccounts
        ) {
            vaultIxes.push(...(await this.buildVaultInstruction()));
        }

        if (!this.options.excludeLookups) {
            const { lookupTable, lookupTableInstructions } = await this.buildLookupInstructions();
            vaultIxes.push(...lookupTableInstructions.slice(0, 1));
            lookupIxes.push(...lookupTableInstructions.slice(1));

            response.lookupTable = lookupTable;
        }

        response.vaultTransaction = await builder.setInstructions(vaultIxes).build();
        response.marketTransactions = await this.buildMarketTransactions(
            builder,
            longIxes,
            shortIxes,
            lookupIxes
        );

        return response;
    }

    private async buildMarketInstructions(): Promise<{
        pools: PublicKey[];
        long: TransactionInstruction[];
        short: TransactionInstruction[];
    }> {
        const pools: PublicKey[] = [];
        const longIxes: TransactionInstruction[] = [];
        const shortIxes: TransactionInstruction[] = [];

        if (!this.options.excludeSol) {
            if (!this.options.excludeLong) {
                pools.push(PDA.getLongPool(this.mint, NATIVE_MINT));
                longIxes.push(
                    ...(await createInitLongPoolInstruction(this.program, {
                        currency: NATIVE_MINT,
                        collateral: this.mint,
                        admin: this.program.provider.publicKey!
                    }))
                );
            }
            if (!this.options.excludeShort) {
                pools.push(PDA.getShortPool(NATIVE_MINT, this.mint));
                shortIxes.push(
                    ...(await createInitShortPoolInstruction(this.program, {
                        currency: this.mint,
                        collateral: NATIVE_MINT,
                        admin: this.program.provider.publicKey!
                    }))
                );
            }
        }

        if (!this.options.excludeUsdc) {
            const usdc = new PublicKey(USDC_MINT);

            if (!this.options.excludeLong) {
                pools.push(PDA.getLongPool(this.mint, usdc));
                longIxes.push(
                    ...(await createInitLongPoolInstruction(this.program, {
                        currency: usdc,
                        collateral: this.mint,
                        admin: this.program.provider.publicKey!
                    }))
                );

                if (!this.options.excludeAta) {
                    const longPool = PDA.getLongPool(this.mint, usdc);

                    longIxes.push(
                        createAssociatedTokenAccountIdempotentInstruction(
                            this.program.provider.publicKey!,
                            getAssociatedTokenAddressSync(
                                NATIVE_MINT,
                                longPool,
                                true,
                                TOKEN_PROGRAM_ID
                            ),
                            longPool,
                            NATIVE_MINT,
                            TOKEN_PROGRAM_ID
                        )
                    );
                }
            }

            if (!this.options.excludeShort) {
                pools.push(PDA.getShortPool(usdc, this.mint));
                shortIxes.push(
                    ...(await createInitShortPoolInstruction(this.program, {
                        currency: this.mint,
                        collateral: usdc,
                        admin: this.program.provider.publicKey!
                    }))
                );

                if (!this.options.excludeAta) {
                    const shortPool = PDA.getShortPool(usdc, this.mint);

                    shortIxes.push(
                        createAssociatedTokenAccountIdempotentInstruction(
                            this.program.provider.publicKey!,
                            getAssociatedTokenAddressSync(
                                NATIVE_MINT,
                                shortPool,
                                true,
                                TOKEN_PROGRAM_ID
                            ),
                            shortPool,
                            NATIVE_MINT,
                            TOKEN_PROGRAM_ID
                        )
                    );
                }
            }
        }

        return {
            pools,
            long: longIxes,
            short: shortIxes
        };
    }

    async buildMarketTransactions(
        builder: TransactionBuilder,
        longIxes: TransactionInstruction[],
        shortIxes: TransactionInstruction[],
        lookupIxes: TransactionInstruction[]
    ): Promise<VersionedTransaction[]> {
        const transactions: VersionedTransaction[] = [];

        const validateAndBuildTxn = async (ixes: TransactionInstruction[]) => {
            let txn;

            builder.setStripLimitIx(transactions.length > 0 || !this.options.excludeVault);

            txn = await builder.setInstructions(ixes).build();

            return txn;
        };

        if (lookupIxes.length > 0) {
            transactions.push(await validateAndBuildTxn(lookupIxes.slice(1)));
            transactions.push(await validateAndBuildTxn(lookupIxes.slice(0, 1)));
        }

        if (longIxes.length > 0) {
            transactions.push(await validateAndBuildTxn(longIxes));
        }

        if (shortIxes.length > 0) {
            transactions.push(await validateAndBuildTxn(shortIxes));
        }

        return transactions;
    }

    private async buildVaultInstruction(): Promise<TransactionInstruction[]> {
        return await createInitLpVaultInstruction(
            this.program,
            {
                name: this.name,
                symbol: this.symbol,
                uri: this.uri
            },
            {
                admin: this.program.provider.publicKey!,
                assetMint: this.mint
            }
        );
    }

    async buildLookupInstructions(): Promise<{
        lookupTable: PublicKey;
        lookupTableInstructions: TransactionInstruction[];
    }> {
        // Asset Vault
        const lpVault = PDA.getLpVault(this.mint);
        // eslint-disable-next-line prefer-const
        let [addresses, assetTokenProgram] = await Promise.all([
            this.getCommonLookupTableAddresses(),
            this.program.provider.connection.getAccountInfo(this.mint).then((acc) => {
                if (!acc) {
                    throw new Error('Mint does not exist')
                }

                return acc.owner
            })
        ]);

        addresses.push(
            ...[
                this.mint,
                lpVault,
                getAssociatedTokenAddressSync(this.mint, lpVault, true, assetTokenProgram),
                PDA.getSharesMint(lpVault, this.mint)
            ]
        );

        // SOL Vault
        const solLpVault = PDA.getLpVault(NATIVE_MINT);
        const solVault = getAssociatedTokenAddressSync(
            NATIVE_MINT,
            solLpVault,
            true,
            TOKEN_PROGRAM_ID
        );
        const solSharesMint = PDA.getSharesMint(solLpVault, NATIVE_MINT);

        addresses.push(...[solLpVault, solVault, solSharesMint]);

        // SOL Long
        const solLongPool = PDA.getLongPool(this.mint, NATIVE_MINT);
        const solLongPoolQuoteVault = getAssociatedTokenAddressSync(
            NATIVE_MINT,
            solLongPool,
            true,
            TOKEN_PROGRAM_ID
        );
        const solLongPoolBaseVault = getAssociatedTokenAddressSync(
            this.mint,
            solLongPool,
            true,
            assetTokenProgram
        );
        addresses.push(...[solLongPool, solLongPoolQuoteVault, solLongPoolBaseVault]);

        // SOL Short
        const solShortPool = PDA.getShortPool(NATIVE_MINT, this.mint);
        const solShortPoolQuoteVault = getAssociatedTokenAddressSync(
            this.mint,
            solShortPool,
            true,
            assetTokenProgram
        );
        const solShortPoolBaseVault = getAssociatedTokenAddressSync(
            NATIVE_MINT,
            solShortPool,
            true,
            TOKEN_PROGRAM_ID
        );

        addresses.push(...[solShortPool, solShortPoolQuoteVault, solShortPoolBaseVault]);

        // USDC Vault
        const usdc = new PublicKey(USDC_MINT);
        const usdcLpVault = PDA.getLpVault(usdc);
        const usdcVault = getAssociatedTokenAddressSync(usdc, usdcLpVault, true, TOKEN_PROGRAM_ID);
        const usdcSharesMint = PDA.getSharesMint(usdcLpVault, usdc);
        addresses.push(...[usdc, usdcLpVault, usdcVault, usdcSharesMint]);

        // USDC Long
        const usdcLongPool = PDA.getLongPool(this.mint, usdc);
        const usdcLongPoolQuoteVault = getAssociatedTokenAddressSync(
            usdc,
            usdcLongPool,
            true,
            TOKEN_PROGRAM_ID
        );
        const usdcLongPoolBaseVault = getAssociatedTokenAddressSync(
            this.mint,
            usdcLongPool,
            true,
            assetTokenProgram
        );
        addresses.push(...[usdcLongPool, usdcLongPoolQuoteVault, usdcLongPoolBaseVault]);

        // USDC Short
        const usdcShortPool = PDA.getShortPool(this.mint, usdc);
        const usdcShortPoolQuoteVault = getAssociatedTokenAddressSync(
            this.mint,
            usdcShortPool,
            true,
            assetTokenProgram
        );
        const usdcShortPoolBaseVault = getAssociatedTokenAddressSync(
            usdc,
            usdcShortPool,
            true,
            TOKEN_PROGRAM_ID
        );
        addresses.push(...[usdcShortPool, usdcShortPoolQuoteVault, usdcShortPoolBaseVault]);

        // Protocol wallets
        addresses.push(
            ...[
                ...WALLETS.FEE[NATIVE_MINT.toBase58() as keyof typeof WALLETS.FEE],
                ...WALLETS.LIQUIDATION[NATIVE_MINT.toBase58() as keyof typeof WALLETS.LIQUIDATION]
            ]
        );
        addresses.push(...[...WALLETS.FEE[USDC_MINT], ...WALLETS.LIQUIDATION[USDC_MINT]]);

        const lookupTableInstructions: TransactionInstruction[] = [];

        if (!this.lookupTable) {
            const [createLookupTableIx, _lookupTable] = AddressLookupTableProgram.createLookupTable(
                {
                    authority: this.program.provider.publicKey!,
                    payer: this.program.provider.publicKey!,
                    recentSlot: await this.program.provider.connection
                        .getLatestBlockhashAndContext('finalized')
                        .then((bh) => bh.context.slot)
                }
            );
            this.lookupTable = _lookupTable;
            lookupTableInstructions.push(createLookupTableIx);
        }

        // 29 is the maximum number of addresses one transaction can hold
        // These should not be at the end of the bundle as adding a tip IX may become problematic
        // We typically generate 53 addresses
        const step = 27;
        for (let i = 0; i <= addresses.length - 1; i += step) {
            const addressesToAdd = addresses.slice(i, Math.min(i + step, addresses.length));

            lookupTableInstructions.push(
                AddressLookupTableProgram.extendLookupTable({
                    lookupTable: this.lookupTable,
                    authority: this.program.provider.publicKey!,
                    payer: this.program.provider.publicKey,
                    addresses: addressesToAdd
                })
            );
        }

        return {
            lookupTable: this.lookupTable,
            lookupTableInstructions
        };
    }

    private getCommonLookupTableAddresses(): PublicKey[] {
        return [
            PDA.getGlobalSettings(),
            PDA.getDebtController(),
            PDA.getSuperAdmin(),
            SystemProgram.programId,
            SYSVAR_INSTRUCTIONS_PUBKEY,
            TOKEN_PROGRAM_ID,
            TOKEN_2022_PROGRAM_ID,
            NATIVE_MINT,
            this.swapAuthority!,
            PDA.getAdmin(this.swapAuthority!)
        ];
    }
}
