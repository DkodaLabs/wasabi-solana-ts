import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type WithdrawArgs = {
    amount: number, // u64
}

export type WithdrawAccounts = {
    assetMint: PublicKey,
}

export async function createWithdrawInstruction(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
): Promise<TransactionInstruction> {
    const assetTokenProgram = await getTokenProgram(program, accounts.assetMint);

    return program.methods.withdraw({
        amount: new BN(args.amount),
    }).accounts({
        owner: program.provider.publicKey,
        lpVault: PDA.getLpVault(accounts.assetMint, program.programId),
        assetMint: accounts.assetMint,
        assetTokenProgram,
    }).instruction();
}
