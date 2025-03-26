import { Program } from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction,
    SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountIdempotentInstruction,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID
} from '@solana/spl-token';
import { PDA } from '../utils';
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

export interface DeployerResponse {
    pools: PublicKey[];
    vaultTransaction?: VersionedTransaction;
    marketTransactions: VersionedTransaction[];
    lookupTable?: PublicKey;
}

/*
/ For a vault only launch we set all flags but excludeVault to true
 */
export type DeployerOptions = {
    excludeLong?: boolean;
    excludeShort?: boolean;
    excludeLookups?: boolean;
    excludeSol?: boolean;
    excludeUsdc?: boolean;
    excludeAta?: boolean;
    excludeVault?: boolean;
    lookupOnly?: boolean;
};

/*
/
 */
export class DeployerBuilder {
    private mint!: PublicKey;
    private name!: string;
    private symbol!: string;
    private uri!: string;
    private program!: Program<WasabiSolana>;
    private swapAuthority?: PublicKey;
    private options: DeployerOptions = {};
    private computeBudget?: ComputeBudgetConfig;

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

    setOptions(options: Partial<DeployerOptions>): this {
        this.options = { ...this.options, ...options };
        return this;
    }

    setComputeBudget(computeBudget: ComputeBudgetConfig): this {
        this.computeBudget = computeBudget;
        return this;
    }

    async createInitLookupTableInstructions(tokenProgram: PublicKey): Promise<{
        lookupTable: PublicKey;
        lookupTableInstructions: TransactionInstruction[];
    }> {
        const lpVault = PDA.getLpVault(this.mint);
        const [addresses, assetTokenProgram] = await Promise.all([
            this.getCommonLookupTableAddresses(),
            this.program.provider.connection.getAccountInfo(this.mint).then((acc) => acc.owner)
        ]);

        if (!this.options.excludeVault) {
            addresses.push(
                ...[
                    this.mint,
                    lpVault,
                    getAssociatedTokenAddressSync(this.mint, lpVault, true, assetTokenProgram),
                    PDA.getSharesMint(lpVault, this.mint)
                ]
            );
        }

        if (!this.options.excludeSol) {
            const solLpVault = PDA.getLpVault(NATIVE_MINT);
            const solVault = getAssociatedTokenAddressSync(
                NATIVE_MINT,
                solLpVault,
                true,
                TOKEN_PROGRAM_ID
            );
            const solSharesMint = PDA.getSharesMint(solLpVault, NATIVE_MINT);

            addresses.push(...[solLpVault, solVault, solSharesMint]);

            if (!this.options.excludeLong) {
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
                    tokenProgram
                );

                addresses.push(...[solLongPool, solLongPoolQuoteVault, solLongPoolBaseVault]);
            }
            if (!this.options.excludeShort) {
                const solShortPool = PDA.getShortPool(NATIVE_MINT, this.mint);
                const solShortPoolQuoteVault = getAssociatedTokenAddressSync(
                    this.mint,
                    solShortPool,
                    true,
                    tokenProgram
                );
                const solShortPoolBaseVault = getAssociatedTokenAddressSync(
                    NATIVE_MINT,
                    solShortPool,
                    true,
                    TOKEN_PROGRAM_ID
                );

                addresses.push(...[solShortPool, solShortPoolQuoteVault, solShortPoolBaseVault]);
            }

            addresses.push(
                ...[
                    ...WALLETS.FEE[NATIVE_MINT.toBase58()],
                    ...WALLETS.LIQUIDATION[NATIVE_MINT.toBase58()]
                ]
            );
        }

        if (!this.options.excludeUsdc) {
            const usdc = new PublicKey(USDC_MINT);
            const usdcLpVault = PDA.getLpVault(usdc);
            const usdcVault = getAssociatedTokenAddressSync(
                usdc,
                usdcLpVault,
                true,
                TOKEN_PROGRAM_ID
            );
            const usdcSharesMint = PDA.getSharesMint(usdcLpVault, usdc);

            addresses.push(...[usdc, usdcLpVault, usdcVault, usdcSharesMint]);

            if (!this.options.excludeShort) {
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
                    tokenProgram
                );

                addresses.push(...[usdcLongPool, usdcLongPoolQuoteVault, usdcLongPoolBaseVault]);
            }

            if (!this.options.excludeLong) {
                const usdcShortPool = PDA.getShortPool(this.mint, usdc);
                const usdcShortPoolQuoteVault = getAssociatedTokenAddressSync(
                    this.mint,
                    usdcShortPool,
                    true,
                    tokenProgram
                );
                const usdcShortPoolBaseVault = getAssociatedTokenAddressSync(
                    usdc,
                    usdcShortPool,
                    true,
                    TOKEN_PROGRAM_ID
                );

                addresses.push(...[usdcShortPool, usdcShortPoolQuoteVault, usdcShortPoolBaseVault]);
            }

            addresses.push(...[...WALLETS.FEE[USDC_MINT], ...WALLETS.LIQUIDATION[USDC_MINT]]);
        }

        const lookupTableInstructions: TransactionInstruction[] = [];

        const [createLookupTableIx, lookupTable] = AddressLookupTableProgram.createLookupTable({
            authority: this.program.provider.publicKey,
            payer: this.program.provider.publicKey,
            recentSlot: await this.program.provider.connection
                .getLatestBlockhashAndContext()
                .then((bh) => bh.context.slot)
        });
        lookupTableInstructions.push(createLookupTableIx);

        // 18 was the maximum number of accounts I found I could reliably fit in a transaction
        const step = 10;
        for (let i = 0; i <= addresses.length - 1; i += step) {
            const addressesToAdd = addresses.slice(i, Math.min(i + step, addresses.length));

            lookupTableInstructions.push(
                AddressLookupTableProgram.extendLookupTable({
                    lookupTable,
                    authority: this.program.provider.publicKey,
                    payer: this.program.provider.publicKey,
                    addresses: addressesToAdd
                })
            );
        }

        return {
            lookupTable,
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

    private validateRequiredFields(): void {
        if (!this.mint) throw new Error('Mint is required');
        if (!this.program) throw new Error('Program is required');

        if (!this.options.excludeVault && !this.options.lookupOnly) {
            if (!this.name) throw new Error('Name is required');
            if (!this.symbol) throw new Error('Symbol is required');
            if (!this.uri) throw new Error('URI is required');
        }
    }

    async build(): Promise<DeployerResponse> {
        this.validateRequiredFields();

        const latestBlockhash = (await this.program.provider.connection.getLatestBlockhash())
            .blockhash;
        const builder = new TransactionBuilder()
            .setPayer(this.program.provider.publicKey)
            .setConnection(this.program.provider.connection)
            .setComputeBudgetConfig(this.computeBudget)
            .setRecentBlockhash(latestBlockhash);

        const response = <DeployerResponse>{};

        if (!this.options.excludeVault && !this.options.lookupOnly) {
            response.vaultTransaction = await this.buildVaultTransaction(builder);
        }

        const ixes: TransactionInstruction[] = [];

        if (
            (!this.options.excludeSol ||
            !this.options.excludeUsdc ||
            !this.options.excludeLong ||
            !this.options.excludeShort) &&
            !this.options.lookupOnly
        ) {
            const { pools, instructions } = await this.buildMarketInstructions();
            response.pools = pools;
            ixes.push(...instructions);
        }

        if (!this.options.excludeLookups) {
            const { lookupTable, lookupTableInstructions } = await this.buildLookupInstructions();
            ixes.push(...lookupTableInstructions);
            response.lookupTable = lookupTable;
        }

        response.marketTransactions = await this.buildMarketTransactions(builder, ixes);

        return response;
    }

    private async buildMarketInstructions(): Promise<{
        pools: PublicKey[];
        instructions: TransactionInstruction[];
        lookupTable: PublicKey;
    }> {
        const pools: PublicKey[] = [];
        const instructions: TransactionInstruction[] = [];

        if (!this.options.excludeSol) {
            if (!this.options.excludeLong) {
                pools.push(PDA.getLongPool(this.mint, NATIVE_MINT));
                instructions.push(
                    ...(await createInitLongPoolInstruction(this.program, {
                        currency: NATIVE_MINT,
                        collateral: this.mint,
                        admin: this.program.provider.publicKey
                    }))
                );
            }
            if (!this.options.excludeShort) {
                pools.push(PDA.getShortPool(NATIVE_MINT, this.mint));
                instructions.push(
                    ...(await createInitShortPoolInstruction(this.program, {
                        currency: this.mint,
                        collateral: NATIVE_MINT,
                        admin: this.program.provider.publicKey
                    }))
                );
            }
        }

        if (!this.options.excludeUsdc) {
            const usdc = new PublicKey(USDC_MINT);

            if (!this.options.excludeLong) {
                pools.push(PDA.getLongPool(this.mint, usdc));
                instructions.push(
                    ...(await createInitLongPoolInstruction(this.program, {
                        currency: usdc,
                        collateral: this.mint,
                        admin: this.program.provider.publicKey
                    }))
                );

                if (!this.options.excludeAta) {
                    const longPool = PDA.getLongPool(this.mint, usdc);

                    instructions.push(
                        createAssociatedTokenAccountIdempotentInstruction(
                            this.program.provider.publicKey,
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
                instructions.push(
                    ...(await createInitShortPoolInstruction(this.program, {
                        currency: this.mint,
                        collateral: usdc,
                        admin: this.program.provider.publicKey
                    }))
                );

                if (!this.options.excludeAta) {
                    const shortPool = PDA.getShortPool(usdc, this.mint);

                    instructions.push(
                        createAssociatedTokenAccountIdempotentInstruction(
                            this.program.provider.publicKey,
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

        let marketLookupTable: PublicKey | undefined = undefined;

        if (!this.options.excludeLookups) {
            const { lookupTable, lookupTableInstructions } = await this.buildLookupInstructions();
            marketLookupTable = lookupTable;
            instructions.push(...lookupTableInstructions);
        }

        return {
            pools,
            instructions,
            lookupTable: marketLookupTable
        };
    }

    async buildMarketTransactions(
        builder: TransactionBuilder,
        instructions: TransactionInstruction[]
    ): Promise<VersionedTransaction[]> {
        const transactions: VersionedTransaction[] = [];
        let lastValidTxn: VersionedTransaction | undefined = undefined;

        const validateAndBuildTxn = async (
            ixToAdd?: TransactionInstruction,
            resetInstructions: boolean = false
        ) => {
            try {
                let txn;

                builder.setStripLimitIx(transactions.length > 0 || this.options.excludeVault);

                if (resetInstructions && ixToAdd) {
                    txn = await builder.setInstructions([ixToAdd]).build();
                } else if (ixToAdd) {
                    txn = await builder.addInstructions(ixToAdd).build();
                } else {
                    txn = await builder.build();
                }

                const serializedTxnLen = txn.serialize().length;

                if (serializedTxnLen >= MAX_SERIALIZED_LEN) {
                    throw new Error(`Transaction is too large: ${serializedTxnLen}`);
                }

                return txn;
            } catch (error) {
                if (resetInstructions && ixToAdd) {
                    throw new Error(
                        `Single instruction is too large and cannot be processed: ${error}`
                    );
                }
                throw error;
            }
        };

        for (const ix of instructions) {
            try {
                lastValidTxn = await validateAndBuildTxn(ix);
            } catch (error) {
                if ((transactions.length === 0 && !lastValidTxn) || !lastValidTxn)
                    throw new Error('Transaction is too large and cannot be broken down');
                transactions.push(lastValidTxn);

                lastValidTxn = await validateAndBuildTxn(ix, true);
            }
        }

        if (lastValidTxn && !transactions.includes(lastValidTxn)) {
            if (transactions.length >= (this.options.excludeVault ? 5 : 4)) {
                throw new Error(
                    'Failed to append last transaction - transaction limit reached (5)'
                );
            }
            transactions.push(lastValidTxn);
        }

        return transactions;
    }

    private async buildLookupInstructions(): Promise<{
        lookupTable: PublicKey;
        lookupTableInstructions: TransactionInstruction[];
    }> {
        return await this.createInitLookupTableInstructions(
            await this.program.provider.connection
                .getAccountInfo(this.mint)
                .then((acc) => acc.owner)
        );
    }

    private async buildVaultTransaction(
        builder: TransactionBuilder
    ): Promise<VersionedTransaction> {
        const instructions = await createInitLpVaultInstruction(
            this.program,
            {
                name: this.name,
                symbol: this.symbol,
                uri: this.uri
            },
            {
                admin: this.program.provider.publicKey,
                assetMint: this.mint
            }
        );

        return await builder.setInstructions(instructions).build();
    }
}
