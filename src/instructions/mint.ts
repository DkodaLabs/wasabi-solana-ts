import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type MintArgs = {
    sharesAmount: number, // u64
}
export type MintAccounts = {
    assetMint: PublicKey,
}

export async function createMintInstruction(
    program: Program<WasabiSolana>,
    args: MintArgs,
    accounts: MintAccounts,
): Promise<TransactionInstruction> {
    const assetTokenProgram = await getTokenProgram(program, accounts.assetMint);

    return program.methods.mint({
        sharesAmount: new BN(args.sharesAmount),
    }).accounts({
        owner: program.provider.publicKey,
        lpVault: PDA.getLpVault(accounts.assetMint, program.programId),
        assetMint: accounts.assetMint,
        assetTokenProgram,
    }).instruction();
}
