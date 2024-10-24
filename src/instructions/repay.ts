import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import {
    getAssociatedTokenAddressSync
} from "@solana/spl-token";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { PDA, getTokenProgram } from "../utils";

export type RepayArgs = {
    amount: number, // u64
}

export type RepayAccounts = {
    mint: PublicKey,
}

export async function createRepayInstruction(
    program: Program<WasabiSolana>,
    args: RepayArgs,
    accounts: RepayAccounts,
): Promise<TransactionInstruction> {
    const lpVault = PDA.getLpVault(accounts.mint, program.programId);
    const [lpVaultInfo, tokenProgram] = await Promise.all([
        program.account.lpVault.fetch(lpVault),
        getTokenProgram(program, accounts.mint),
    ]);

    return program.methods.repay({
        amount: lpVaultInfo.totalBorrowed.addn(args.amount),
    }).accounts({
        payer: program.provider.publicKey,
        mint: accounts.mint,
        source: getAssociatedTokenAddressSync(
            accounts.mint,
            program.provider.publicKey,
            false,
            tokenProgram,
        ),
        lpVault,
        tokenProgram,
    }).instruction();
}
