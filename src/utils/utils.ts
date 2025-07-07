import {
    PublicKey,
    Connection,
    SystemProgram,
    TransactionInstruction,
    LAMPORTS_PER_SOL,
    AccountInfo
} from '@solana/web3.js';
import { Program, utils, BN, IdlAccounts } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    NATIVE_MINT,
    NATIVE_MINT_2022,
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    AccountLayout,
    MintLayout,
    getTokenMetadata,
    getAssociatedTokenAddressSync,
    createSyncNativeInstruction,
    createCloseAccountInstruction,
    createAssociatedTokenAccountIdempotentInstruction
} from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';
import { MintCache } from './mintCache';

export const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111111');

export const WASABI_PROGRAM_ID = new PublicKey('spicyTHtbmarmUxwFSHYpA8G4uP2nRNq38RReMpoZ9c');
export const METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');

export const SEED_PREFIX = {
    LONG_POOL: 'long_pool',
    SHORT_POOL: 'short_pool',
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    LP_VAULT: 'lp_vault',
    POSITION: 'position',
    OPEN_POSITION: 'open_pos',
    CLOSE_POSITION: 'close_pos',
    STOP_LOSS_ORDER: 'stop_loss_order',
    TAKE_PROFIT_ORDER: 'take_profit_order',
    DEBT_CONTROLLER: 'debt_controller',
    GLOBAL_SETTINGS: 'global_settings',
    EVENT_AUTHORITY: '__event_authority',
    STRATEGY: 'strategy',
    STRATEGY_REQ: 'strategy_request'
} as const;

function findProgramAddress(seeds: Uint8Array[], programId: PublicKey): PublicKey {
    const [publicKey] = PublicKey.findProgramAddressSync(seeds, programId);
    return publicKey;
}

export async function getPermission(
    program: Program<WasabiSolana>,
    admin: PublicKey
): Promise<PublicKey> {
    let permission: PublicKey;
    const superAdmin = PDA.getSuperAdmin();
    const permissionInfo = await program.account.permission.fetch(superAdmin);

    if (permissionInfo.authority === admin) {
        permission = superAdmin;
    } else {
        permission = PDA.getAdmin(admin);
    }

    return permission;
}

export function uiAmountToAmount(uiAmount: number, decimals: number): BN {
    return new BN(Math.floor(uiAmount * 10 ** decimals));
}

export function amountToUiAmount(amount: BN, decimals: number): number {
    return amount.toNumber() / 10 ** decimals;
}

export async function getTokenProgram(
    connection: Connection,
    mint: PublicKey,
    mintCache?: MintCache
): Promise<PublicKey | null> {
    if (mintCache) {
        const mintInfo = await mintCache.getMintInfos([mint]);
        if (mintInfo) {
            const mintAccount = mintInfo.get(mint);
            if (mintAccount) {
                return mintAccount.owner;
            }
        }
    }

    const mintInfo = await connection.getAccountInfo(mint);

    if (!mintInfo) {
        return null;
    }

    if (mintInfo.owner.equals(TOKEN_PROGRAM_ID) || mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        return mintInfo.owner;
    } else {
        return null;
    }
}

export async function getTokenProgramAndDecimals(
    connection: Connection,
    mint: PublicKey
): Promise<[PublicKey, number] | null> {
    const mintInfo = await connection.getAccountInfo(mint);

    if (!mintInfo) {
        return null;
    }

    if (mintInfo.owner.equals(TOKEN_PROGRAM_ID) || mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        const mintDecimals = MintLayout.decode(mintInfo.data).decimals;
        return [mintInfo.owner, mintDecimals];
    } else {
        return null;
    }
}

export const PDA = {
    getLongPool(collateral: PublicKey, currency: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.LONG_POOL),
                collateral.toBuffer(),
                currency.toBuffer()
            ],
            WASABI_PROGRAM_ID
        );
    },

    getShortPool(collateral: PublicKey, currency: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.SHORT_POOL),
                collateral.toBuffer(),
                currency.toBuffer()
            ],
            WASABI_PROGRAM_ID
        );
    },

    getSuperAdmin(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.SUPER_ADMIN)],
            WASABI_PROGRAM_ID
        );
    },

    getAdmin(admin: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.ADMIN), admin.toBuffer()],
            WASABI_PROGRAM_ID
        );
    },

    getLpVault(mint: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.LP_VAULT), mint.toBuffer()],
            WASABI_PROGRAM_ID
        );
    },

    getSharesMint(lpVault: PublicKey, mint: PublicKey): PublicKey {
        return findProgramAddress([lpVault.toBuffer(), mint.toBuffer()], WASABI_PROGRAM_ID);
    },

    getSharesMetadata(sharesMint: PublicKey): PublicKey {
        return findProgramAddress(
            [Buffer.from('metadata'), METADATA_PROGRAM_ID.toBuffer(), sharesMint.toBuffer()],
            METADATA_PROGRAM_ID
        );
    },

    getPosition(owner: PublicKey, pool: PublicKey, lpVault: PublicKey, nonce: number): PublicKey {
        const nonceBuffer = Buffer.alloc(2);
        nonceBuffer.writeUInt16LE(nonce);
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.POSITION),
                owner.toBuffer(),
                pool.toBuffer(),
                lpVault.toBuffer(),
                nonceBuffer
            ],
            WASABI_PROGRAM_ID
        );
    },

    getOpenPositionRequest(owner: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.OPEN_POSITION), owner.toBuffer()],
            WASABI_PROGRAM_ID
        );
    },

    getClosePositionRequest(owner: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.CLOSE_POSITION), owner.toBuffer()],
            WASABI_PROGRAM_ID
        );
    },

    getTakeProfitOrder(position: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.TAKE_PROFIT_ORDER), position.toBuffer()],
            WASABI_PROGRAM_ID
        );
    },

    getStopLossOrder(position: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.STOP_LOSS_ORDER), position.toBuffer()],
            WASABI_PROGRAM_ID
        );
    },

    getEventAuthority(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.EVENT_AUTHORITY)],
            WASABI_PROGRAM_ID
        );
    },

    getDebtController(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.DEBT_CONTROLLER)],
            WASABI_PROGRAM_ID
        );
    },

    getGlobalSettings(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.GLOBAL_SETTINGS)],
            WASABI_PROGRAM_ID
        );
    },

    getStrategy(lpVault: PublicKey, collateral: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.STRATEGY),
                lpVault.toBuffer(),
                collateral.toBuffer()
            ],
            WASABI_PROGRAM_ID
        );
    },

    getStrategyRequest(strategy: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.STRATEGY_REQ), strategy.toBuffer()],
            WASABI_PROGRAM_ID
        );
    }
};

type TokenData = {
    decimals: number;
    name?: string;
    symbol?: string;
    address: string;
};

export async function getMintInfo(
    connection: Connection,
    mint: PublicKey
): Promise<TokenData | null> {
    try {
        let metadata: any;

        const mintAccount = await connection.getAccountInfo(mint);
        if (!mintAccount) return null;

        if (mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            metadata = await getTokenMetadata(connection, mint, 'confirmed');

            if (!metadata) {
                metadata = await getMetaplexMetadata(connection, mint);
            }
        } else {
            metadata = await getMetaplexMetadata(connection, mint);
        }

        const mintInfo = MintLayout.decode(mintAccount.data);

        if (!metadata) return null;

        return {
            decimals: mintInfo.decimals,
            name: metadata.name,
            symbol: metadata.symbol,
            address: mint.toString()
        };
    } catch (error) {
        return null;
    }
}

export async function getMetaplexMetadata(
    connection: Connection,
    mint: PublicKey
): Promise<{
    name: string;
    symbol: string;
} | null> {
    try {
        const metaplex = Metaplex.make(connection);
        const metadata = await metaplex.nfts().findByMint({ mintAddress: mint });
        return {
            name: metadata.name,
            symbol: metadata.symbol
        };
    } catch (error) {
        return null;
    }
}

// Mint is the mint of the token in the vault
export async function getMaxWithdraw(
    program: Program<WasabiSolana>,
    mint: PublicKey
): Promise<bigint> {
    const providerPubkey = validateProviderPubkey(program.provider.publicKey);
    return getMaxWithdrawForUser(program, mint, providerPubkey);
}

export async function getMaxWithdrawForUser(
    program: Program<WasabiSolana>,
    mint: PublicKey,
    userAddress: PublicKey
): Promise<bigint> {
    const lpVaultAddress = PDA.getLpVault(mint);
    const sharesMintAddress = PDA.getSharesMint(lpVaultAddress, mint);
    const userSharesAddress = getAssociatedTokenAddressSync(
        sharesMintAddress,
        userAddress,
        false,
        TOKEN_2022_PROGRAM_ID
    );
    const [lpVault, userSharesInfo, sharesMintInfo] = await Promise.all([
        program.account.lpVault.fetch(lpVaultAddress),
        program.provider.connection.getAccountInfo(userSharesAddress),
        program.provider.connection.getAccountInfo(sharesMintAddress)
    ]);

    if (!lpVault || !userSharesInfo || !sharesMintInfo) {
        return 0n;
    }

    const sharesMint = MintLayout.decode(sharesMintInfo.data);
    const userShares = AccountLayout.decode(userSharesInfo.data);

    const totalAssets = BigInt(lpVault.totalAssets.toString());
    const totalShares = BigInt(sharesMint.supply.toString());
    const userSharesAmount = BigInt(userShares.amount.toString());

    if (totalShares === 0n) {
        return totalShares;
    }

    return calculateAssetsFromShares(userSharesAmount, totalShares, totalAssets);
}

export function calculateAssetsFromShares(
    shares: bigint,
    totalShares: bigint,
    totalAssets: bigint
): bigint {
    return (shares * totalAssets) / totalShares;
}

export async function getNativeBalance(
    connection: Connection,
    userAddress: PublicKey
): Promise<number | null> {
    try {
        const balance = await connection.getBalance(userAddress);
        return balance / LAMPORTS_PER_SOL;
    } catch (error) {
        console.error('Error fetch SOL balance:', error);
        return null;
    }
}

export async function getVaultInfoFromAsset(
    program: Program<WasabiSolana>,
    asset: PublicKey
): Promise<IdlAccounts<WasabiSolana>['lpVault']> {
    const lpVault = PDA.getLpVault(asset);
    return program.account.lpVault.fetch(lpVault);
}

export async function getUserVaultBalances(
    program: Program<WasabiSolana>,
    wallet?: PublicKey
): Promise<{ asset: PublicKey; shares: bigint }[]> {
    const walletToCheck = wallet || program.provider.publicKey;

    if (!walletToCheck) {
        throw new Error('Wallet not set');
    }

    const [vaults, tokenAccounts] = await Promise.all([
        program.account.lpVault.all(),
        program.provider.connection.getTokenAccountsByOwner(walletToCheck, {
            programId: TOKEN_2022_PROGRAM_ID
        })
    ]);

    const shareMints = vaults.map((vault) => vault.account.sharesMint);

    const shareBalances = await Promise.all(
        tokenAccounts.value.map(async ({ account }) => {
            const tokenAccount = AccountLayout.decode(account.data);
            const mint = new PublicKey(tokenAccount.mint);

            if (shareMints.some((shareMint) => shareMint.equals(mint))) {
                const vault = vaults.find((v) => v.account.sharesMint.equals(mint));

                if (vault) {
                    return {
                        asset: vault.account.asset,
                        shares: tokenAccount.amount
                    };
                }
            }

            return undefined;
        })
    );

    return shareBalances.filter(balance => balance !== undefined);
}

export async function getMultipleTokenAccounts(
    program: Program<WasabiSolana>,
    owner: PublicKey,
    mints: PublicKey[]
): Promise<number[]> {
    const mintInfos = await program.provider.connection.getMultipleAccountsInfo(mints);

    const results = new Array<number>(mints.length).fill(0);
    const validATAs: PublicKey[] = [];
    const ataIndexMap = new Map<string, number>();

    mints.forEach((mint, i) => {
        const mintInfo = mintInfos[i];
        if (!mintInfo) return;

        const tokenProgram = mintInfo.owner;
        if (!tokenProgram.equals(TOKEN_PROGRAM_ID) && !tokenProgram.equals(TOKEN_2022_PROGRAM_ID))
            return;

        const ata = getAssociatedTokenAddressSync(mint, owner, false, tokenProgram);
        validATAs.push(ata);
        ataIndexMap.set(ata.toBase58(), i);
    });

    if (validATAs.length === 0) return results;

    const tokenAccountInfos = await program.provider.connection.getMultipleAccountsInfo(validATAs);

    tokenAccountInfos.forEach((accountInfo, i) => {
        if (!accountInfo) return;

        const ataAddress = validATAs[i].toBase58();
        const originalIndex = ataIndexMap.get(ataAddress);

        if (originalIndex !== undefined) {
            const accountData = AccountLayout.decode(accountInfo.data);
            results[originalIndex] = Number(accountData.amount);
        }
    });

    return results;
}

export function isSOL(mint: PublicKey): boolean {
    return mint.equals(SOL_MINT);
}

export function isNativeMint(mint: PublicKey): boolean {
    return mint.equals(NATIVE_MINT) || mint.equals(NATIVE_MINT_2022);
}

export async function createAtaIfNeeded(
    connection: Connection,
    owner: PublicKey,
    mint: PublicKey,
    ata: PublicKey,
    tokenProgram: PublicKey,
    payer?: PublicKey
): Promise<TransactionInstruction | null> {
    if (isNativeMint(mint)) return null;

    const account = await connection.getAccountInfo(ata);
    if (!account) {
        return createAssociatedTokenAccountIdempotentInstruction(
            payer ? payer : owner,
            ata,
            owner,
            mint,
            tokenProgram
        );
    }

    return null;
}

export async function createWrapSolInstruction(
    connection: Connection,
    owner: PublicKey,
    amount: number | bigint,
    includeCleanupIx: boolean = true,
    useToken2022: boolean = false
): Promise<{
    setupIx: TransactionInstruction[];
    cleanupIx: TransactionInstruction[];
}> {
    const setupIx: TransactionInstruction[] = [];
    const cleanupIx: TransactionInstruction[] = [];
    const [nativeMint, tokenProgram] = useToken2022
        ? [NATIVE_MINT_2022, TOKEN_2022_PROGRAM_ID]
        : [NATIVE_MINT, TOKEN_PROGRAM_ID];

    const ownerWrappedSolAta = getAssociatedTokenAddressSync(
        nativeMint,
        owner,
        false,
        tokenProgram
    );

    const ownerWrappedSolAccount = await connection.getAccountInfo(ownerWrappedSolAta);

    if (!ownerWrappedSolAccount) {
        setupIx.push(
            createAssociatedTokenAccountIdempotentInstruction(
                owner,
                ownerWrappedSolAta,
                owner,
                nativeMint,
                tokenProgram
            )
        );
        if (includeCleanupIx) {
            cleanupIx.push(
                createCloseAccountInstruction(ownerWrappedSolAta, owner, owner, [], tokenProgram)
            );
        }
    }

    setupIx.push(
        SystemProgram.transfer({
            fromPubkey: owner,
            toPubkey: ownerWrappedSolAta,
            lamports: amount
        })
    );

    setupIx.push(createSyncNativeInstruction(ownerWrappedSolAta, tokenProgram));

    return { setupIx, cleanupIx };
}

export async function createUnwrapSolInstruction(
    connection: Connection,
    owner: PublicKey,
    useToken2022: boolean = false
): Promise<{
    setupIx: TransactionInstruction[];
    cleanupIx: TransactionInstruction[];
}> {
    return await createUnwrapSolInstructionWithPayer(connection, owner, owner, useToken2022);
}

export async function createUnwrapSolInstructionWithPayer(
    connection: Connection,
    payer: PublicKey,
    owner: PublicKey,
    useToken2022: boolean = false
): Promise<{
    setupIx: TransactionInstruction[];
    cleanupIx: TransactionInstruction[];
}> {
    const setupIx: TransactionInstruction[] = [];
    const cleanupIx: TransactionInstruction[] = [];
    const [nativeMint, tokenProgram] = useToken2022
        ? [NATIVE_MINT_2022, TOKEN_2022_PROGRAM_ID]
        : [NATIVE_MINT, TOKEN_PROGRAM_ID];

    const ownerWrappedSolAta = getAssociatedTokenAddressSync(
        nativeMint,
        owner,
        false,
        tokenProgram
    );

    const ownerWrappedSolAccount = await connection.getAccountInfo(ownerWrappedSolAta);

    if (!ownerWrappedSolAccount) {
        setupIx.push(
            createAssociatedTokenAccountIdempotentInstruction(
                payer,
                ownerWrappedSolAta,
                owner,
                nativeMint,
                tokenProgram
            )
        );
    }

    if (owner.equals(payer)) {
        cleanupIx.push(
            createCloseAccountInstruction(ownerWrappedSolAta, owner, owner, [], tokenProgram)
        );
    }

    return { setupIx, cleanupIx };
}

export function handleSOL(useToken2022: boolean = false): {
    tokenProgram: PublicKey;
    nativeMint: PublicKey;
} {
    return {
        tokenProgram: useToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID,
        nativeMint: useToken2022 ? NATIVE_MINT_2022 : NATIVE_MINT
    };
}

type MintResult = {
    mint: PublicKey;
    tokenProgram: PublicKey;
    setupIx?: TransactionInstruction[];
    cleanupIx?: TransactionInstruction[];
};

type TokenProgramsResult = {
    currencyMint: PublicKey;
    collateralMint: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
};

type TokenProgramsWithSetupResult = TokenProgramsResult & {
    setupIx: TransactionInstruction[];
    cleanupIx: TransactionInstruction[];
};

type WrapMode = 'wrap' | 'unwrap' | undefined;

export async function handleMint(
    connection: Connection,
    mint: PublicKey,
    options: {
        owner?: PublicKey;
        wrapMode?: WrapMode;
        amount?: number | bigint;
        mintCache?: MintCache;
    }
): Promise<MintResult> {
    let instructions: { setupIx: TransactionInstruction[], cleanupIx: TransactionInstruction[] } = { setupIx: [], cleanupIx: [] };
    if (isSOL(mint)) {
        const { tokenProgram, nativeMint } = handleSOL();

        if (options.owner && options.wrapMode) {
            instructions =
                options.wrapMode === 'wrap'
                    ? await createWrapSolInstruction(connection, options.owner, options.amount!)
                    : await createUnwrapSolInstruction(connection, options.owner);
        }

        return {
            mint: nativeMint,
            tokenProgram,
            ...instructions
        };
    }

    const tokenProgram = await getTokenProgram(connection, mint, options.mintCache);
    if (!tokenProgram) {
        throw new Error('Token program not found');
    }

    if (options.owner) {
        const userAta = getAssociatedTokenAddressSync(mint, options.owner, true, tokenProgram);
        const userTokenAccount = await connection.getAccountInfo(userAta);

        if (!userTokenAccount) {
            instructions.setupIx.push(
                createAssociatedTokenAccountIdempotentInstruction(
                    options.owner,
                    userAta,
                    options.owner,
                    mint,
                    tokenProgram
                )
            );
        }
    }

    return {
        mint,
        tokenProgram,
        ...instructions
    };
}

export async function handleMintsAndTokenProgram(
    connection: Connection,
    currency: PublicKey,
    collateral: PublicKey,
    options: {
        owner?: PublicKey;
        mintCache?: MintCache;
    }
): Promise<TokenProgramsResult> {
    if (currency.equals(collateral)) {
        throw new Error('Mints cannot be the same');
    }

    const [currencyResult, collateralResult] = await Promise.all([
        handleMint(connection, currency, { owner: options.owner, mintCache: options.mintCache }),
        handleMint(connection, collateral, { owner: options.owner, mintCache: options.mintCache })
    ]);

    return {
        currencyMint: currencyResult.mint,
        collateralMint: collateralResult.mint,
        currencyTokenProgram: currencyResult.tokenProgram,
        collateralTokenProgram: collateralResult.tokenProgram
    };
}

export async function handleMintsAndTokenProgramWithSetupAndCleanup(
    connection: Connection,
    owner: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    wrapMode: WrapMode,
    amount?: number | bigint,
    mintCache?: MintCache
): Promise<TokenProgramsWithSetupResult> {
    if (currency.equals(collateral)) {
        throw new Error('Mints cannot be the same');
    }

    const [currencyResult, collateralResult] = await Promise.all([
        handleMint(connection, currency, { owner, wrapMode, amount, mintCache }),
        handleMint(connection, collateral, { owner, wrapMode, amount, mintCache })
    ]);

    return {
        currencyMint: currencyResult.mint,
        collateralMint: collateralResult.mint,
        currencyTokenProgram: currencyResult.tokenProgram,
        collateralTokenProgram: collateralResult.tokenProgram,
        setupIx: [...(currencyResult.setupIx || []), ...(collateralResult.setupIx || [])],
        cleanupIx: [...(currencyResult.cleanupIx || []), ...(collateralResult.cleanupIx || [])]
    };
}

export async function handlePaymentTokenMint(
    connection: Connection,
    owner: PublicKey,
    paymentToken: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    wrapMode: WrapMode,
    amount?: number | bigint,
    mintCache?: MintCache
): Promise<TokenProgramsWithSetupResult> {
    return await handlePaymentTokenMintWithAuthority(
        connection,
        owner, // authority
        owner,
        paymentToken,
        currency,
        collateral,
        wrapMode,
        amount,
        mintCache
    );
}

export async function handlePaymentTokenMintWithAuthority(
    connection: Connection,
    authority: PublicKey,
    owner: PublicKey,
    paymentToken: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    wrapMode: WrapMode,
    amount?: number | bigint,
    mintCache?: MintCache
): Promise<TokenProgramsWithSetupResult> {
    let instructions: { setupIx: TransactionInstruction[]; cleanupIx: TransactionInstruction[] } = {
        setupIx: [],
        cleanupIx: []
    };

    if (paymentToken.equals(NATIVE_MINT)) {
        instructions =
            wrapMode === 'wrap'
                ? await createWrapSolInstruction(connection, owner, amount!, false)
                : await createUnwrapSolInstructionWithPayer(connection, authority, owner);
    }

    const [currencyTokenProgram, collateralTokenProgram] = await Promise.all([
        getTokenProgram(connection, currency, mintCache),
        getTokenProgram(connection, collateral, mintCache)
    ]);

    if (!currencyTokenProgram || !collateralTokenProgram) {
        throw new Error('Token program not found');
    }

    return {
        currencyMint: currency,
        collateralMint: collateral,
        currencyTokenProgram,
        collateralTokenProgram,
        setupIx: instructions.setupIx,
        cleanupIx: instructions.cleanupIx
    };
}

type OpenTokenAccountArgs = {
    program: Program<WasabiSolana>;
    owner: PublicKey;
    downPayment: number | bigint;
    fee: number | bigint;
    mintCache?: MintCache;
    isLongPool: boolean;
    currency: PublicKey;
    collateral: PublicKey;
    useShares?: boolean;
};

export type OpenTokenAccounts = {
    paymentMint?: PublicKey;
    paymentIsSol?: boolean;
    ownerPaymentAta?: PublicKey;
    setupIx: TransactionInstruction[];
    cleanupIx: TransactionInstruction[];
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
};

export async function handleOpenTokenAccounts({
    program,
    owner,
    downPayment,
    fee,
    mintCache,
    isLongPool,
    currency,
    collateral,
    useShares
}: OpenTokenAccountArgs): Promise<OpenTokenAccounts> {
    let setupIx: TransactionInstruction[] = [];
    const cleanupIx: TransactionInstruction[] = [];

    let mintInfos: Map<PublicKey, AccountInfo<Buffer>>;
    if (mintCache !== undefined) {
        mintInfos = await mintCache.getMintInfos([currency, collateral]);
    } else {
        const result = await program.provider.connection.getMultipleAccountsInfo([
            currency,
            collateral
        ]);

        if (!result) {
            throw new Error('Could not get mint info');
        }

        mintInfos = new Map();
        if (result[0]) mintInfos.set(currency, result[0]);
        if (result[1]) mintInfos.set(collateral, result[1]);
    }
    const currencyInfo = mintInfos.get(currency);
    const collateralInfo = mintInfos.get(collateral);

    const paymentMintInfo = isLongPool ? currencyInfo : collateralInfo;
    const paymentMint = isLongPool ? currency : collateral;
    const paymentTokenProgram = paymentMintInfo!.owner;
    const paymentIsSol = paymentMint.equals(NATIVE_MINT);

    const ownerPaymentAta = getAssociatedTokenAddressSync(
        paymentMint,
        owner,
        false,
        paymentTokenProgram
    );

    if (paymentIsSol && !useShares) {
        setupIx.push(
            SystemProgram.transfer({
                fromPubkey: owner,
                toPubkey: ownerPaymentAta,
                lamports: Number(downPayment) + Number(fee)
            })
        );

        setupIx.push(createSyncNativeInstruction(ownerPaymentAta, paymentTokenProgram));

        cleanupIx.push(
            createCloseAccountInstruction(ownerPaymentAta, owner, owner, [], paymentTokenProgram)
        );
    }

    const ownerPaymentAtaInfo = await program.provider.connection.getAccountInfo(ownerPaymentAta);

    if (!ownerPaymentAtaInfo) {
        setupIx = [
            createAssociatedTokenAccountIdempotentInstruction(
                owner,
                ownerPaymentAta,
                owner,
                paymentMint,
                paymentTokenProgram
            ),
            ...setupIx
        ];
    }

    if (!currencyInfo || !collateralInfo) {
        throw new Error('Could not get mint info');
    }

    return {
        paymentMint,
        paymentIsSol,
        ownerPaymentAta,
        currencyTokenProgram: currencyInfo.owner,
        collateralTokenProgram: collateralInfo.owner,
        setupIx,
        cleanupIx
    };
}

export type CloseTokenAccounts = {
    payoutMint?: PublicKey;
    payoutIsSol: boolean;
    ownerPayoutAta: PublicKey;
    setupIx: TransactionInstruction[];
    cleanupIx: TransactionInstruction[];
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
};

export async function handleCloseTokenAccounts(
    config: {
        program: Program<WasabiSolana>;
        owner: PublicKey;
        mintCache: MintCache;
    },
    poolAccount: {
        isLongPool: boolean;
        currency: PublicKey;
        collateral: PublicKey;
    }
): Promise<CloseTokenAccounts> {
    const [currencyInfo, collateralInfo] = await config.mintCache.getMintInfos([
        poolAccount.currency,
        poolAccount.collateral
    ]);

    const payoutMintInfo = poolAccount.isLongPool ? currencyInfo : collateralInfo;
    const payoutMint = payoutMintInfo[0];
    const payoutTokenProgram = payoutMintInfo[1].owner;
    const payoutIsSol = payoutMint.equals(NATIVE_MINT);

    const ownerPayoutAta = getAssociatedTokenAddressSync(
        payoutMint,
        config.owner,
        false,
        payoutTokenProgram
    );

    const ownerPayoutAtaInfo = await config.program.provider.connection.getAccountInfo(
        ownerPayoutAta
    );

    const setupIx: TransactionInstruction[] = [];
    const cleanupIx: TransactionInstruction[] = [];
    if (!ownerPayoutAtaInfo) {
        setupIx.push(
            createAssociatedTokenAccountIdempotentInstruction(
                config.owner,
                ownerPayoutAta,
                config.owner,
                payoutMint,
                payoutTokenProgram
            )
        );
    }

    if (payoutIsSol) {
        cleanupIx.push(
            createCloseAccountInstruction(
                ownerPayoutAta,
                config.owner,
                config.owner,
                [],
                payoutTokenProgram
            )
        );
    }

    return {
        payoutMint,
        payoutIsSol,
        ownerPayoutAta,
        setupIx,
        cleanupIx,
        currencyTokenProgram: currencyInfo[1].owner,
        collateralTokenProgram: collateralInfo[1].owner
    };
}

export function validateArgs<T>(args: T): NonNullable<T> {
    if (!args) {
        throw new Error('Args are required');
    }

    return args;
}

export function validateProviderPubkey(payer: PublicKey | undefined): NonNullable<PublicKey> {
    if (!payer) {
        throw new Error('Payer is required');
    }

    return payer;
}

export function validateMintCache(mintCache: MintCache | undefined): NonNullable<MintCache> {
    if (!mintCache) {
        throw new Error('Mint cache is required');
    }

    return mintCache;
}