import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { getPermission } from "../utils";

export type InitLpVaultAccounts = {
    admin: PublicKey,
    assetMint: PublicKey,
}

export async function createInitLpVaultInstruction(
    program: Program<WasabiSolana>,
    accounts: InitLpVaultAccounts,
): Promise<TransactionInstruction> {
    const permission = await getPermission(program, accounts.admin);

    return program.methods.initLpVault()
        .accounts({
            payer: program.provider.publicKey,
            permission,
            assetMint: accounts.assetMint,
        }).instruction();
}
