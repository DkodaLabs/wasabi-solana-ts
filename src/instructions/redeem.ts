import { Program, BN } from "@coral-xyz/anchor";
import { TransactionSignature, TransactionInstruction } from "@solana/web3.js";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from "../base";
import {
    RedeemArgs,
    RedeemAccounts,
    TokenInstructionAccounts,
    TokenInstructionAccountsStrict,
    getTokenInstructionAccounts
} from "./tokenAccounts";
import { getTokenProgramAndDecimals, uiAmountToAmount } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export const redeemConfig: BaseMethodConfig<
    RedeemArgs,
    RedeemAccounts,
    TokenInstructionAccounts | TokenInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<RedeemArgs, RedeemAccounts>) => {
        const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
            config.program.provider.connection,
            config.accounts.assetMint
        );

        const allAccounts = await getTokenInstructionAccounts(
            config.program,
            config.accounts.assetMint,
            assetTokenProgram
        );

        return {
            accounts: config.strict ? allAccounts : {
                owner: config.program.provider.publicKey,
                lpVault: allAccounts.lpVault,
                assetMint: config.accounts.assetMint,
                assetTokenProgram,
            },
            args: config.args ? new BN(uiAmountToAmount(config.args.amount, mintDecimals)) : undefined
        };
    },
    getMethod: (program) => (args) => program.methods.redeem(args)
};

export async function createRedeemInstruction(
    program: Program<WasabiSolana>,
    args: RedeemArgs,
    accounts: RedeemAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            redeemConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function redeem(
    program: Program<WasabiSolana>,
    args: RedeemArgs,
    accounts: RedeemAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            redeemConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
