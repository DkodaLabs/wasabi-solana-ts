import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitTakeProfitArgs = {
    position: PublicKey,
    makerAmount: number, // u64
    takerAmount: number, // u64
}

export function createInitTakeProfitOrderInstruction(
    program: Program<WasabiSolana>,
    args: InitTakeProfitArgs,
): Promise<TransactionInstruction> {
    return program.methods.initTakeProfitOrder({
        makerAmount: new BN(args.makerAmount),
        takerAmount: new BN(args.takerAmount),
    }).accounts({
        position: args.position,
    }).instruction();
}
