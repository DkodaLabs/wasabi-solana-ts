import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type RedeemArgs = {
    sharesAmount: number, // u64
}

export type RedeemAccounts = {
    assetMint: PublicKey,
}

export async function createRedeemInstruction(
    program: Program<WasabiSolana>,
    args: RedeemArgs,
    accounts: RedeemAccounts,
): Promise<TransactionInstruction> {
    const assetTokenProgram = await getTokenProgram(program, accounts.assetMint);

    return program.methods.redeem({
        sharesAmount: new BN(args.sharesAmount),
    }).accounts({
        owner: program.provider.publicKey,
        lpVault: PDA.getLpVault(accounts.assetMint, program.programId),
        assetMint: accounts.assetMint,
        assetTokenProgram,
    }).instruction();
}
