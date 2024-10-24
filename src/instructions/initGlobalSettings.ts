import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitGlobalSettingsArgs = {
    superAdmin: PublicKey,
    feeWallet: PublicKey,
    statuses: number, // u16
}

export function createInitGlobalSettingsInstruction(
    program: Program<WasabiSolana>,
    args: InitGlobalSettingsArgs,
): Promise<TransactionInstruction> {
    return program.methods.initGlobalSettings({
        superAdmin: args.superAdmin,
        feeWallet: args.feeWallet,
        statuses: args.statuses,
    }).accounts({
        payer: program.provider.publicKey,
    }).instruction();
}
