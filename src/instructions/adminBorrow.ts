import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { PDA, getTokenProgram } from "../utils";

export type AdminBorrowArgs = {
    amount: number // u64
}

export type AdminBorrowAccounts = {
    currency: PublicKey,
}

export async function createAdminBorrowInstruction(
    program: Program<WasabiSolana>,
    args: AdminBorrowArgs,
    accounts: AdminBorrowAccounts,
): Promise<TransactionInstruction> {
    const lpVault = PDA.getLpVault(accounts.currency, program.programId);

    const tokenProgram = await getTokenProgram(program, accounts.currency);

    return program.methods.adminBorrow({
        amount: new BN(args.amount)
    }).accounts({
        payer: program.provider.publicKey,
        lpVault,
        currency: accounts.currency,
        tokenProgram,
    }).instruction();
}
