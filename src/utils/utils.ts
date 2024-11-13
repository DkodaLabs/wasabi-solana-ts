import { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import {
    PublicKey,
    Connection,
    SendOptions,
    VersionedTransaction,
    TransactionSignature,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Program, utils, BN, IdlAccounts } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    AccountLayout,
    MintLayout,
    getTokenMetadata,
    getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { Metaplex } from '@metaplex-foundation/js';

export const WASABI_PROGRAM_ID = new PublicKey('Amxm1TKpMsue3x5KrnAzV9U8Sn7afDQQnmMV9znTfd96');

export const SEED_PREFIX = {
    LONG_POOL: 'long_pool',
    SHORT_POOL: 'short_pool',
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    LP_VAULT: 'lp_vault',
    POSITION: 'position',
    OPEN_POSTIION: 'open_pos',
    CLOSE_POSITION: 'close_pos',
    STOP_LOSS_ORDER: 'stop_loss_order',
    TAKE_PROFIT_ORDER: 'take_profit_order',
    DEBT_CONTROLLER: 'debt_controller',
    GLOBAL_SETTINGS: 'global_settings',
    EVENT_AUTHORITY: '__event_authority'
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
    mint: PublicKey
): Promise<PublicKey | null> {
    const mintInfo = await connection.getAccountInfo(mint);

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

    if (mintInfo.owner.equals(TOKEN_PROGRAM_ID) || mintInfo.owner.equals(TOKEN_2022_PROGRAM_ID)) {
        let mintDecimals = MintLayout.decode(mintInfo.data).decimals;
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
            [utils.bytes.utf8.encode(SEED_PREFIX.OPEN_POSTIION), owner.toBuffer()],
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
        let metadata;

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
export async function getMaxWithdraw(program: Program<WasabiSolana>, mint: PublicKey): Promise<BN> {
    const lpVaultAddress = PDA.getLpVault(mint);
    const sharesMintAddress = PDA.getSharesMint(lpVaultAddress, mint);
    const userSharesAddress = getAssociatedTokenAddressSync(
        sharesMintAddress,
        program.provider.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
    );
    const [lpVault, userSharesInfo, sharesMintInfo] = await Promise.all([
        program.account.lpVault.fetch(lpVaultAddress),
        program.provider.connection.getAccountInfo(userSharesAddress),
        program.provider.connection.getAccountInfo(sharesMintAddress)
    ]);

    if (!lpVault || !userSharesInfo || !sharesMintInfo) return null;

    const sharesMint = MintLayout.decode(sharesMintInfo.data);
    const userShares = AccountLayout.decode(userSharesInfo.data);

    const totalAssets = new BN(lpVault.totalAssets);
    const totalShares = new BN(sharesMint.supply.toString());
    const userSharesAmount = new BN(userShares.amount.toString());

    if (totalShares.isZero()) return new BN(0);

    const maxWithdrawRaw = userSharesAmount.mul(totalAssets).div(totalShares);

    return maxWithdrawRaw;
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
    const vaults = await program.account.lpVault.all();
    const shareMints = vaults.map((vault) => vault.account.sharesMint);

    const walletToCheck = wallet || program.provider.publicKey;
    const tokenAccounts = await program.provider.connection.getTokenAccountsByOwner(walletToCheck, {
        programId: TOKEN_2022_PROGRAM_ID
    });

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
        })
    );

    return shareBalances.filter(Boolean);
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

export async function handleSerializedTransaction(
    wallet: Pick<SignerWalletAdapter, 'publicKey' | 'signTransaction'>,
    serializedTransaction: string,
    connection: Connection,
    options: SendOptions = { maxRetries: 3 }
): Promise<TransactionSignature> {
    try {
        if (!wallet.publicKey) {
            throw new Error('Wallet not connected');
        }

        if (!wallet.signTransaction) {
            throw new Error('Wallet does not support transaction signing');
        }

        const serializedBuffer = Buffer.from(serializedTransaction, 'base64');
        const transaction = VersionedTransaction.deserialize(serializedBuffer);

        const message = transaction.message;
        const feePayerPubkey = message.staticAccountKeys[0];

        if (!feePayerPubkey.equals(wallet.publicKey)) {
            throw new Error('Fee payer public key mismatch');
        }

        const signedTransaction = await wallet.signTransaction(transaction);

        if (transaction.signatures.length < message.header.numRequiredSignatures) {
            throw new Error(
                `Transaction requires ${message.header.numRequiredSignatures} signatures but only has ${transaction.signatures.length}`
            );
        }

        if (!signedTransaction.signatures[0]) {
            throw new Error('Fee payer signature is missing');
        }

        const signature = await connection.sendTransaction(signedTransaction, options);

        const latestBlockhash = await connection.getLatestBlockhash();
        const confirmation = await connection.confirmTransaction({
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
        });

        if (confirmation.value.err) {
            throw new Error(`Transaction confirmation failed: ${confirmation.value.err}`);
        }

        return signature;
    } catch (error) {
        console.error('Transaction failed:', error);
        throw error;
    }
}
