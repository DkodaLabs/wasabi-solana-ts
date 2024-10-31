import { Program, BN } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    PublicKey,
    TransactionSignature
} from "@solana/web3.js";
import { getTokenProgramAndDecimals } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { uiAmountToAmount } from "../utils";
import { getTokenInstructionAccounts } from "./tokenAccounts";

export type WithdrawArgs = {
    amount: number, // u64
}

export type WithdrawAccounts = {
    assetMint: PublicKey,
}

export async function createWithdrawInstruction(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    strict: boolean = true,
): Promise<TransactionInstruction> {
    const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(program.provider.connection, accounts.assetMint);

    const amount = uiAmountToAmount(args.amount, mintDecimals);
    const depositAccounts = await getTokenInstructionAccounts(
        program,
        accounts.assetMint,
        assetTokenProgram
    );

    const methodCall = program.methods.withdraw(new BN(amount));

    if (strict) {
        return methodCall.accountsStrict(depositAccounts).instruction();
    } else {
        const {
            owner,
            lpVault,
            assetMint,
            assetTokenProgram
        } = depositAccounts;

        return methodCall.accounts({
            owner,
            lpVault,
            assetMint,
            assetTokenProgram,
        }).instruction();
    }
}

export async function withdraw(
    program: Program<WasabiSolana>,
    args: WithdrawArgs,
    accounts: WithdrawAccounts,
    strict: boolean = true
): Promise<TransactionSignature> {
    const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
        program.provider.connection,
        accounts.assetMint
    );

    const amount = uiAmountToAmount(args.amount, mintDecimals);
    const withdrawAccounts = await getTokenInstructionAccounts(
        program,
        accounts.assetMint,
        assetTokenProgram
    );

    const methodCall = program.methods.deposit(amount);

    if (strict) {
        return methodCall.accountsStrict(withdrawAccounts).rpc();
    } else {
        const {
            owner,
            lpVault,
            assetMint,
            assetTokenProgram
        } = withdrawAccounts;

        return methodCall.accounts({
            owner,
            lpVault,
            assetMint,
            assetTokenProgram,
        }).rpc();
    }
}
