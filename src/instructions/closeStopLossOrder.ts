import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type CloseStopLossOrderArgs = {
    position: PublicKey,
}

export function createCloseStopLossOrderInstruction(
    program: Program<WasabiSolana>,
    args: CloseStopLossOrderArgs,
): Promise<TransactionInstruction> {
    return program.methods.closeStopLossOrder()
        .accounts({
            position: args.position,
        }).instruction();
}
