import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type SetMaxLeverageArgs = {
    maxLeverage: number, // u64
}

export function createSetMaxLeverageInstruction(
    program: Program<WasabiSolana>,
    args: SetMaxLeverageArgs,
): Promise<TransactionInstruction> {
    return program.methods.setMaxLeverage({
        maxLeverage: new BN(args.maxLeverage),
    }).accounts({
        authority: program.provider.publicKey,
    }).instruction();
}
