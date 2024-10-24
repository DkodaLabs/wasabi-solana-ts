import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitStopLossArgs = {
    makerAmount: number, // u64
    takerAmount: number, // u64
    position: PublicKey,
}

export function createInitStopLossInstruction(
    program: Program<WasabiSolana>,
    args: InitStopLossArgs,
): Promise<TransactionInstruction> {
    return program.methods.initStopLossOrder({
        makerAmount: new BN(args.makerAmount),
        takerAmount: new BN(args.takerAmount),
    }).accounts({
        position: args.position,
    }).instruction();
}

