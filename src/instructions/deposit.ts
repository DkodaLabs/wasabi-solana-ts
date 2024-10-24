import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type DepositArgs = {
    amount: number, // u64
}

export type DepositAccounts = {
    assetMint: PublicKey,
}

export async function createDepositInstruction(
    program: Program<WasabiSolana>,
    args: DepositArgs,
    accounts: DepositAccounts,
): Promise<TransactionInstruction> {
    const assetTokenProgram = await getTokenProgram(program, accounts.assetMint);

    return program.methods.deposit({
        amount: new BN(args.amount),
    }).accounts({
        owner: program.provider.publicKey,
        lpVault: PDA.getLpVault(accounts.assetMint, program.programId),
        assetMint: accounts.assetMint,
        assetTokenProgram,
    }).instruction();
}

