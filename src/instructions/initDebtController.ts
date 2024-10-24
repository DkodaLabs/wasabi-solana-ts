import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitDebtControllerArgs = {
    maxApy: number, // u64
    maxLeverage: number, // u64
}

export function createInitDebtControllerInstruction(
    program: Program<WasabiSolana>,
    args: InitDebtControllerArgs,
): Promise<TransactionInstruction> {
    return program.methods.initDebtController({
        maxApy: new BN(args.maxApy),
        maxLeverage: new BN(args.maxLeverage),
    }).accounts({
        authority: program.provider.publicKey
    }).instruction();
}
