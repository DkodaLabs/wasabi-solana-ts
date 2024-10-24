import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { PDA, getPermission } from "../utils";

export type UpdateVaultMaxBorrowArgs = {
    maxBorrow: number, // u64
}

export type UpdateVaultMaxBorrowAccounts = {
    admin: PublicKey,
    assetMint: PublicKey,
}

export async function createUpdateMaxBorrowInstruction(
    program: Program<WasabiSolana>,
    args: UpdateVaultMaxBorrowArgs,
    accounts: UpdateVaultMaxBorrowAccounts,
): Promise<TransactionInstruction> {
    const permission = await getPermission(program, accounts.admin);
    const lpVault = PDA.getLpVault(accounts.assetMint, program.programId);

    return program.methods.updateLpVaultMaxBorrow({
        maxBorrow: new BN(args.maxBorrow),
    }).accounts({
        payer: program.provider.publicKey,
        permission,
        lpVault,
    }).instruction();
}
