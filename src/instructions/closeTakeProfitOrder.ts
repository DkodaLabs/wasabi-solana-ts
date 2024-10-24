import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type CloseTpArgs = {
    position: PublicKey,
}

export function createCloseTpOrderInstruction(
    program: Program<WasabiSolana>,
    args: CloseTpArgs,
): Promise<TransactionInstruction> {
    return program.methods.closeTakeProfitOrder()
        .accounts({
            position: args.position,
        }).instruction();
}
