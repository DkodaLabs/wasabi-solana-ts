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

export const depositConfig: BaseMethodConfig<AmountArgs, MintAccounts, BN, TokenInstructionAccounts> = {
    processArgs: async (args, program, accounts) => {
        const [, mintDecimals] = await getTokenProgramAndDecimals(
            program.provider.connection,
            accounts.assetMint
        );
        return new BN(uiAmountToAmount(args.amount, mintDecimals));
    },

    processAccounts: async (program, accounts) => {
        const [assetTokenProgram] = await getTokenProgramAndDecimals(
            program.provider.connection,
            accounts.assetMint
        );

        return getTokenInstructionAccounts(
            program,
            accounts.assetMint,
            assetTokenProgram
        );
    },

    getMethod: (program) => (args) => program.methods.deposit(args),

    getRequiredAccounts: (accounts: TokenInstructionAccounts) => ({
        owner: accounts.owner,
        ownerAssetAccount: accounts.ownerAssetAccount,
        ownerSharesAccount: accounts.ownerSharesAccount,
        lpVault: accounts.lpVault,
        vault: accounts.vault,
        assetMint: accounts.assetMint,
        sharesMint: accounts.sharesMint,
        assetTokenProgram: accounts.assetTokenProgram,
        sharesTokenProgram: accounts.sharesTokenProgram,
        eventAuthority: accounts.eventAuthority,
        program: accounts.program,
    })
};

export async function createDepositInstruction(
    program: Program<WasabiSolana>,
    args: AmountArgs,
    accounts: MintAccounts,
    strict: boolean = true
): Promise<TransactionInstruction> {
    return handleMethodCall(
        program,
        accounts,
        depositConfig,
        'instruction',
        args,
        strict
    ) as Promise<TransactionInstruction>;
}

export async function deposit(
    program: Program<WasabiSolana>,
    args: AmountArgs,
    accounts: MintAccounts,
    strict: boolean = true
): Promise<TransactionSignature> {
    return handleMethodCall(
        program,
        accounts,
        depositConfig,
        'transaction',
        args,
        strict
    ) as Promise<TransactionSignature>;
}
