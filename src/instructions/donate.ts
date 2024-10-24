import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type DonateArgs = {
    amount: number, // u64
}

export type DonateAccounts = {
    currency: PublicKey,
}

export async function createDonateInstruction(
    program: Program<WasabiSolana>,
    args: DonateArgs,
    accounts: DonateAccounts,
): Promise<TransactionInstruction> {
    const tokenProgram = await getTokenProgram(program, accounts.currency);

    return program.methods.donate({
        amount: new BN(args.amount),
    }).accounts({
        owner: program.provider.publicKey,
        lpVault: PDA.getLpVault(accounts.currency, program.programId),
        currency: accounts.currency,
        tokenProgram,
    }).instruction();
}
