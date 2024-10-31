import { Program, BN } from "@coral-xyz/anchor";
import { TransactionSignature, TransactionInstruction } from "@solana/web3.js";
import { BaseMethodConfig, handleMethodCall } from "../base";
import {
    MintAccounts,
    AmountArgs,
    TokenInstructionAccounts,
    getTokenInstructionAccounts
} from "./tokenAccounts";
import { getTokenProgramAndDecimals, uiAmountToAmount } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export const redeemConfig: BaseMethodConfig<AmountArgs, MintAccounts, TokenInstructionAccounts> = {
    process: async (program, accounts, args) => {
        const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
            program.provider.connection,
            accounts.assetMint
        );

        const processedAccounts = await getTokenInstructionAccounts(
            program,
            accounts.assetMint,
            assetTokenProgram
        );

        return {
            accounts: processedAccounts,
            args: args ? new BN(uiAmountToAmount(args.amount, mintDecimals)) : undefined
        };
    },
    getMethod: (program) => (args) => program.methods.redeem(args)
};

export async function createRedeemInstruction(
    program: Program<WasabiSolana>,
    args: AmountArgs,
    accounts: MintAccounts,
    strict: boolean = true
): Promise<TransactionInstruction> {
    return handleMethodCall(
        program,
        accounts,
        redeemConfig,
        'instruction',
        args,
        strict
    ) as Promise<TransactionInstruction>;
}

export async function redeem(
    program: Program<WasabiSolana>,
    args: AmountArgs,
    accounts: MintAccounts,
    strict: boolean = true
): Promise<TransactionSignature> {
    return handleMethodCall(
        program,
        accounts,
        redeemConfig,
        'transaction',
        args,
        strict
    ) as Promise<TransactionSignature>;
}
