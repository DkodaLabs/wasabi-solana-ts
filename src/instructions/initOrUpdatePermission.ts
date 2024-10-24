import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitOrUpdatePermissionArgs = {
    status: AuthorityStatus,
    canInitVaults: boolean,
    canLiquidate: boolean,
    canCosignSwaps: boolean,
    canBorrowFromVaults: boolean,
    canInitPools: boolean,
}

export type InitOrUpdatePermissionAccounts = {
    newAuthority: PublicKey,
}

export enum AuthorityStatus {
    Inactive = 0,
    Active = 1,
}

export function createInitOrUpdatePermissionInstruction(
    program: Program<WasabiSolana>,
    args: InitOrUpdatePermissionArgs,
    accounts: InitOrUpdatePermissionAccounts,
): Promise<TransactionInstruction> {
    return program.methods.initOrUpdatePermission({
        canCosignSwaps: args.canCosignSwaps,
        canInitVaults: args.canInitVaults,
        canLiquidate: args.canLiquidate,
        canBorrowFromVaults: args.canBorrowFromVaults,
        canInitPools: args.canInitPools, // TODO: CHECK
        status: { active: {} }, // TODO: CHECK
    }).accounts({
        payer: program.provider.publicKey,
        newAuthority: accounts.newAuthority,
    }).instruction();
}
