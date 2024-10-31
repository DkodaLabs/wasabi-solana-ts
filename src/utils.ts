import { PublicKey, Connection } from "@solana/web3.js";
import { Program, utils, BN } from "@coral-xyz/anchor";
import { WasabiSolana } from "../idl/wasabi_solana";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MintLayout } from "@solana/spl-token";

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

export async function getTokenProgram(
    program: Program<WasabiSolana>,
    mint: PublicKey
): Promise<PublicKey | null> {
    const mintInfo = await program.provider.connection.getAccountInfo(mint);

    if (mintInfo.owner !== TOKEN_PROGRAM_ID || mintInfo.owner !== TOKEN_2022_PROGRAM_ID) {
        return null;
    } else {
        return mintInfo.owner;
    }
}

export function uiAmountToAmount(uiAmount: number, decimals: number): BN {
    return new BN(Math.floor(uiAmount * 10 ** decimals));
}

export function amountToUiAmount(amount: BN, decimals: number): number {
    return amount.toNumber() / 10 ** decimals;
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
