import { Program } from '@coral-xyz/anchor';
import {
    PublicKey,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction,
    TransactionMessage,
    SYSVAR_INSTRUCTIONS_PUBKEY,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    createAssociatedTokenAccountIdempotentInstruction,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';
import { createInitLpVaultInstruction } from '../instructions/initLpVault';
import { createInitLongPoolInstruction } from '../instructions/initLongPool';
import { createInitShortPoolInstruction } from '../instructions/initShortPool';
import { AddressLookupTableProgram } from '@solana/web3.js';

export const MAX_SERIALIZED_LEN = 1644;
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

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

export type DeployerOptions = {
    excludeLong?: boolean;
    excludeShort?: boolean;
    excludeLookups?: boolean;
    excludeSol?: boolean;
    excludeUsdc?: boolean;
    excludeAta?: boolean;
};

export class DeployerBuilder {
    private mint!: PublicKey;
    private name!: string;
    private symbol!: string;
    private uri!: string;
    private program!: Program<WasabiSolana>;
    private swapAuthority?: PublicKey;
    private options?: DeployerOptions;

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

    setOptions(options: DeployerOptions): this {
        this.options = options;
        return this;
    }

    async createInitLookupTableInstructions(tokenProgram: PublicKey): Promise<{
        lookupTable: PublicKey,
        instructions: TransactionInstruction[]
    }> {
        const lpVault = PDA.getLpVault(this.mint);
        const [addresses, assetTokenProgram] = await Promise.all([
            this.getCommonLookupTableAddresses(),
            this.program.provider.connection
                .getAccountInfo(this.mint)
                .then(acc => acc.owner)
        ]);

        addresses.push(...[
            this.mint,
            lpVault,
            getAssociatedTokenAddressSync(this.mint, lpVault, true, assetTokenProgram),
            PDA.getSharesMint(lpVault, this.mint)
        ]);

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
                    tokenProgram,
                );

                addresses.push(...[usdcLongPool, usdcLongPoolQuoteVault, usdcLongPoolBaseVault]);
            }

            if (!this.options.excludeLong) {
                const usdcShortPool = PDA.getShortPool(this.mint, usdc);
                const usdcShortPoolQuoteVault = getAssociatedTokenAddressSync(
                    this.mint,
                    usdcShortPool,
                    true,
                    TOKEN_PROGRAM_ID
                );
                const usdcShortPoolBaseVault = getAssociatedTokenAddressSync(
                    usdc,
                    usdcShortPool,
                    true,
                    tokenProgram,
                );

                addresses.push(...[usdcShortPool, usdcShortPoolQuoteVault, usdcShortPoolBaseVault]);
            }

            addresses.push(...[...WALLETS.FEE[USDC_MINT], ...WALLETS.LIQUIDATION[USDC_MINT]]);
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
                    tokenProgram,
                );

                addresses.push(...[solLongPool, solLongPoolQuoteVault, solLongPoolBaseVault]);
            }
            if (!this.options.excludeShort) {
                const solShortPool = PDA.getShortPool(this.mint, NATIVE_MINT);
                const solShortPoolQuoteVault = getAssociatedTokenAddressSync(
                    this.mint,
                    solShortPool,
                    true,
                    TOKEN_PROGRAM_ID
                );
                const solShortPoolBaseVault = getAssociatedTokenAddressSync(
                    NATIVE_MINT,
                    solShortPool,
                    true,
                    tokenProgram,
                );

                addresses.push(...[solShortPool, solShortPoolQuoteVault, solShortPoolBaseVault]);
            }

            addresses.push(...[
                ...WALLETS.FEE[NATIVE_MINT.toBase58()],
                ...WALLETS.LIQUIDATION[NATIVE_MINT.toBase58()]
            ]);
        }

        const instructions: TransactionInstruction[] = [];

        const [createLookupTableIx, lookupTable] = AddressLookupTableProgram.createLookupTable({
            authority: this.program.provider.publicKey,
            payer: this.program.provider.publicKey,
            recentSlot: await this.program.provider.connection
                .getLatestBlockhashAndContext()
                .then(bh => bh.context.slot)
        });
        instructions.push(createLookupTableIx);

        // 18 was the maximum number of accounts per transaction I found I could fit reliably
        for (let i = 0; i <= addresses.length - 1; i += 17) {
            const addressesToAdd = addresses.slice(i, i + 17);

            instructions.push(
                AddressLookupTableProgram.extendLookupTable({
                    lookupTable,
                    authority: this.program.provider.publicKey,
                    addresses: addressesToAdd,
                })
            );
        }

        return {
            lookupTable,
            instructions,
        }
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
            PDA.getAdmin(this.swapAuthority!),
        ];
    }

    async build(): Promise<VersionedTransaction[]> {
        if (!this.mint || this.program) {
            throw new Error("Missing required parameters");
        }

        if (!this.name || !this.symbol || !this.uri) {
            throw new Error("Missing required token parameters");
        }

        const instructions: TransactionInstruction[] = [];

        instructions.push(...(await createInitLpVaultInstruction(
            this.program,
            {
                name: this.name,
                symbol: this.symbol,
                uri: this.uri
            },
            {
                admin: this.program.provider.publicKey,
                assetMint: this.mint,
            },
        )));

        if (!this.options.excludeSol) {
            if (!this.options.excludeLong) {
                instructions.push(...(await createInitLongPoolInstruction(
                    this.program, {
                    currency: NATIVE_MINT,
                    collateral: this.mint,
                    admin: this.program.provider.publicKey
                }
                )));
            }
            if (!this.options.excludeShort) {
                instructions.push(...(await createInitShortPoolInstruction(
                    this.program, {
                    currency: this.mint,
                    collateral: NATIVE_MINT,
                    admin: this.program.provider.publicKey
                })));
            }
        }

        if (!this.options.excludeUsdc) {
            const usdc = new PublicKey(USDC_MINT);

            if (!this.options.excludeLong) {
                instructions.push(...(await createInitLongPoolInstruction(this.program, {
                    currency: usdc,
                    collateral: this.mint,
                    admin: this.program.provider.publicKey
                })));

                if (!this.options.excludeAta) {
                    const longPool = PDA.getLongPool(this.mint, usdc);

                    instructions.push(createAssociatedTokenAccountIdempotentInstruction(
                        this.program.provider.publicKey,
                        getAssociatedTokenAddressSync(
                            NATIVE_MINT,
                            longPool,
                            true,
                            this.mint
                        ),
                        longPool,
                        usdc,
                        this.mint,
                    ));
                }
            }

            if (!this.options.excludeShort) {
                instructions.push(...(await createInitShortPoolInstruction(this.program, {
                    currency: this.mint,
                    collateral: usdc,
                    admin: this.program.provider.publicKey
                })));

                if (!this.options.excludeAta) {
                    const shortPool = PDA.getShortPool(usdc, this.mint);

                    instructions.push(createAssociatedTokenAccountIdempotentInstruction(
                        this.program.provider.publicKey,
                        getAssociatedTokenAddressSync(
                            NATIVE_MINT,
                            shortPool,
                            true,
                            this.mint,
                        ),
                        shortPool,
                        usdc,
                        this.mint
                    ));
                }
            }
        }

        if (!this.options.excludeLookups) {
            instructions.push(...(
                await this.createInitLookupTableInstructions(
                    (await this.program.provider.connection
                        .getAccountInfo(this.mint)
                        .then(acc => acc.owner)
                    )
                )
            ).instructions);
        }

        let txIdx = 0;
        let lastTx: VersionedTransaction | undefined = undefined;
        const transactions: VersionedTransaction[] = [];
        const recentBlockhash = (await this.program.provider.connection.getLatestBlockhash()).blockhash;

        for (let i = 0; i <= instructions.length - 1; i++) {
            const transaction = new VersionedTransaction(
                new TransactionMessage({
                    payerKey: this.program.provider.publicKey,
                    recentBlockhash,
                    instructions: instructions.slice(txIdx, i),
                }).compileToV0Message()
            );

            if (transaction.serialize().length >= MAX_SERIALIZED_LEN) {
                if (!lastTx) throw new Error("Transaction is too large and cannot be broken down");

                transactions.push(lastTx);

                lastTx = undefined;
                txIdx = i;

                continue;
            }

            lastTx = transaction;
        }

        return transactions;
    }
}
