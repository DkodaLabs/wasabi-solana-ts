import { PublicKey, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Program, utils, BN } from "@coral-xyz/anchor";
import { WasabiSolana } from "../idl/wasabi_solana";
import {
    TOKEN_PROGRAM_ID,
    TOKEN_2022_PROGRAM_ID,
    AccountLayout,
    MintLayout,
    getTokenMetadata,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { Metaplex } from '@metaplex-foundation/js';

export const WASABI_PROGRAM_ID = new PublicKey("Amxm1TKpMsue3x5KrnAzV9U8Sn7afDQQnmMV9znTfd96");

export const SEED_PREFIX = {
    LONG_POOL: "long_pool",
    SHORT_POOL: "short_pool",
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    LP_VAULT: "lp_vault",
    DEBT_CONTROLLER: "debt_controller",
    GLOBAL_SETTINGS: "global_settings",
    EVENT_AUTHORITY: "__event_authority",
} as const;

function findProgramAddress(seeds: Uint8Array[], programId: PublicKey): PublicKey {
    const [publicKey] = PublicKey.findProgramAddressSync(seeds, programId);
    return publicKey;
}

export async function getPermission(
    program: Program<WasabiSolana>,
    admin: PublicKey,
): Promise<PublicKey> {
    let permission: PublicKey;
    const superAdmin = PDA.getSuperAdmin();
    const permissionInfo = await program.account.permission.fetch(superAdmin)

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
    mint: PublicKey,
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
    getLongPool(
        quoteMint: PublicKey,
        baseMint: PublicKey,
    ): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.LONG_POOL),
                quoteMint.toBuffer(),
                baseMint.toBuffer(),
            ],
            WASABI_PROGRAM_ID,
        );
    },

    getShortPool(
        quoteMint: PublicKey,
        baseMint: PublicKey,
    ): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.SHORT_POOL),
                quoteMint.toBuffer(),
                baseMint.toBuffer(),
            ],
            WASABI_PROGRAM_ID,
        );
    },

    getSuperAdmin(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.SUPER_ADMIN)],
            WASABI_PROGRAM_ID,
        );
    },

    getAdmin(admin: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.ADMIN),
                admin.toBuffer(),
            ],
            WASABI_PROGRAM_ID,
        );
    },

    getLpVault(mint: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.LP_VAULT),
                mint.toBuffer(),
            ],
            WASABI_PROGRAM_ID,
        );
    },

    getSharesMint(lpVault: PublicKey, mint: PublicKey): PublicKey {
        return findProgramAddress(
            [
                lpVault.toBuffer(),
                mint.toBuffer(),
            ],
            WASABI_PROGRAM_ID,
        );
    },

    getEventAuthority(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.EVENT_AUTHORITY)],
            WASABI_PROGRAM_ID,
        );
    },

    getDebtController(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.DEBT_CONTROLLER)],
            WASABI_PROGRAM_ID,
        );
    },

    getGlobalSettings(): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.GLOBAL_SETTINGS)],
            WASABI_PROGRAM_ID,
        );
    }
}

type TokenData = {
    decimals: number;
    name?: string;
    symbol?: string;
    address: string;
}

export async function getMintInfo(connection: Connection, mint: PublicKey): Promise<TokenData | null> {
    try {
        let metadata;

        const mintAccount = await connection.getAccountInfo(mint);
        if (!mintAccount) return null;

        if (mintAccount.owner.equals(TOKEN_2022_PROGRAM_ID)) {
            metadata = await getTokenMetadata(
                connection,
                mint,
                'confirmed'
            );

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

export async function getMetaplexMetadata(connection: Connection, mint: PublicKey): Promise<{
    name: string,
    symbol: string,
} | null> {
    try {
        const metaplex = Metaplex.make(connection);
        const metadata = await metaplex.nfts().findByMint({ mintAddress: mint });
        return {
            name: metadata.name,
            symbol: metadata.symbol,
        };
    } catch (error) {
        return null;
    }
}

// Mint is the mint of the token in the vault
export async function getMaxWithdraw(program: Program<WasabiSolana>, mint: PublicKey): Promise<number | null> {
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
        program.provider.connection.getAccountInfo(sharesMintAddress),
    ]);

    if (!lpVault || !userSharesInfo || !sharesMintInfo) return null;


    const sharesMint = MintLayout.decode(sharesMintInfo.data);
    const userShares = AccountLayout.decode(userSharesInfo.data);

    const mintDecimals = sharesMint.decimals;
    const totalAssets = new BN(lpVault.totalAssets);
    const totalShares = new BN(sharesMint.supply);
    const userSharesAmount = new BN(userShares.amount);

    if (totalShares.isZero()) return null;

    const maxWithdrawRaw = userSharesAmount.mul(totalAssets).div(totalShares);

    return Number(maxWithdrawRaw.toString()) / Math.pow(10, mintDecimals);
}

export async function getNativeBalance(connection: Connection, userAddress: PublicKey): Promise<number | null> {
    try {
        const balance = await connection.getBalance(userAddress);
        return balance / LAMPORTS_PER_SOL
    } catch (error) {
        console.error("Error fetch SOL balance:", error);
        return null;
    }
}
