import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type SetMaxApyArgs = {
    maxApy: number // u64
}

export function createSetMaxApyInstruction(
    program: Program<WasabiSolana>,
    args: SetMaxApyArgs,
): Promise<TransactionInstruction> {
    return program.methods.setMaxApy({
        maxApy: new BN(args.maxApy),
    }).accounts({
        authority: program.provider.publicKey,
    }).instruction();
}
