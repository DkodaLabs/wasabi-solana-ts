import { PublicKey } from "@solana/web3.js";
import { Program, utils } from "@coral-xyz/anchor";
import { WasabiSolana } from "../idl/wasabi_solana";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";

export const SEED_PREFIX = {
    LONG_POOL: "long_pool",
    SHORT_POOL: "short_pool",
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    LP_VAULT: "lp_vault",
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
    const superAdmin = PDA.getSuperAdmin(program.programId);
    const permissionInfo = await program.account.permission.fetch(superAdmin)

    if (permissionInfo.authority === admin) {
        permission = superAdmin;
    } else {
        permission = PDA.getAdmin(admin, program.programId);
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

export const PDA = {
    getLongPool(
        quoteMint: PublicKey,
        baseMint: PublicKey,
        programId: PublicKey,
    ): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.LONG_POOL),
                quoteMint.toBuffer(),
                baseMint.toBuffer(),
            ],
            programId,
        );
    },

    getShortPool(
        quoteMint: PublicKey,
        baseMint: PublicKey,
        programId: PublicKey,
    ): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.SHORT_POOL),
                quoteMint.toBuffer(),
                baseMint.toBuffer(),
            ],
            programId,
        );
    },

    getSuperAdmin(programId: PublicKey): PublicKey {
        return findProgramAddress(
            [utils.bytes.utf8.encode(SEED_PREFIX.SUPER_ADMIN)],
            programId,
        );
    },

    getAdmin(admin: PublicKey, programId: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.ADMIN),
                admin.toBuffer(),
            ],
            programId,
        );
    },

    getLpVault(mint: PublicKey, programId: PublicKey): PublicKey {
        return findProgramAddress(
            [
                utils.bytes.utf8.encode(SEED_PREFIX.LP_VAULT),
                mint.toBuffer(),
            ],
            programId,
        );
    }
}
