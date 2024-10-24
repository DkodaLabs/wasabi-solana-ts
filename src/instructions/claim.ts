import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type ClaimPositionAccounts = {
    currency: PublicKey,
    collateral: PublicKey,
    position: PublicKey,
    pool: PublicKey,
    feeWallet: PublicKey,
}

export async function createClaimPositionInstruction(
    program: Program<WasabiSolana>,
    accounts: ClaimPositionAccounts,
): Promise<TransactionInstruction> {
    const [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
        getTokenProgram(program, accounts.collateral),
        getTokenProgram(program, accounts.currency),
    ]);

    return program.methods.claimPosition()
        .accounts({
            currency: accounts.currency,
            collateral: accounts.collateral,
            position: accounts.position,
            pool: accounts.pool,
            feeWallet: accounts.feeWallet,
            collateralTokenProgram,
            currencyTokenProgram,
        }).instruction();
}
