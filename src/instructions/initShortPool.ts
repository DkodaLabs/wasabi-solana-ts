import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { getPermission, getTokenProgram } from "../utils";

export type InitShortPoolAccounts = {
    collateral: PublicKey,
    currency: PublicKey,
    admin: PublicKey,
}

export async function createInitShortPoolInstruction(
    program: Program<WasabiSolana>,
    accounts: InitShortPoolAccounts,
): Promise<TransactionInstruction> {
    const [permission, collateralTokenProgram, currencyTokenProgram] =
        await Promise.all([
            getPermission(program, accounts.admin),
            getTokenProgram(program, accounts.collateral),
            getTokenProgram(program, accounts.currency),
        ]);


    return program.methods.initShortPool()
        .accounts({
            payer: program.provider.publicKey,
            permission,
            collateral: accounts.collateral,
            currency: accounts.currency,
            collateralTokenProgram,
            currencyTokenProgram,
        }).instruction();
}
