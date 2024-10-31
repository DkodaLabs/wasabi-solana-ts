import { Program } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    PublicKey,
    TransactionSignature
} from "@solana/web3.js";
import { getTokenProgramAndDecimals } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { uiAmountToAmount } from "../utils";
import { getTokenInstructionAccounts } from "./tokenAccounts";

export type MintArgs = {
    amount: number, // u64
}

export type MintAccounts = {
    assetMint: PublicKey,
}

export async function createmintInstruction(
    program: Program<WasabiSolana>,
    args: MintArgs,
    accounts: MintAccounts,
    strict: boolean = true
): Promise<TransactionInstruction> {
    const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
        program.provider.connection,
        accounts.assetMint
    );

    const amount = uiAmountToAmount(args.amount, mintDecimals);
    const mintAccounts = await getTokenInstructionAccounts(
        program,
        accounts.assetMint,
        assetTokenProgram
    );

    const methodCall = program.methods.mint(amount);

    if (strict) {
        return methodCall.accountsStrict(mintAccounts).instruction();
    } else {
        const {
            owner,
            lpVault,
            assetMint,
            assetTokenProgram
        } = mintAccounts;

        return methodCall.accounts({
            owner,
            lpVault,
            assetMint,
            assetTokenProgram,
        }).instruction();
    }
}

export async function mint(
    program: Program<WasabiSolana>,
    args: MintArgs,
    accounts: MintAccounts,
    strict: boolean = true
): Promise<TransactionSignature> {
    const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
        program.provider.connection,
        accounts.assetMint
    );

    const amount = uiAmountToAmount(args.amount, mintDecimals);
    const mintAccounts = await getTokenInstructionAccounts(
        program,
        accounts.assetMint,
        assetTokenProgram
    );

    const methodCall = program.methods.mint(amount);

    if (strict) {
        return methodCall.accountsStrict(mintAccounts).rpc();
    } else {
        const {
            owner,
            lpVault,
            assetMint,
            assetTokenProgram
        } = mintAccounts;

        return methodCall.accounts({
            owner,
            lpVault,
            assetMint,
            assetTokenProgram,
        }).rpc();
    }
}
