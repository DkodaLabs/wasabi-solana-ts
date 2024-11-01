import { Program, BN } from "@coral-xyz/anchor";
import { TransactionSignature, TransactionInstruction } from "@solana/web3.js";
import {
    BaseMethodConfig,
    handleMethodCall,
    ConfigArgs,
    constructMethodCallArgs,
} from "../base";
import {
    DepositAccounts,
    DepositArgs,
    TokenInstructionAccounts,
    TokenInstructionAccountsStrict,
    getTokenInstructionAccounts
} from "./tokenAccounts";
import { getTokenProgramAndDecimals, uiAmountToAmount } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";
import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction } from "@solana/spl-token";

const depositConfig: BaseMethodConfig<
    DepositArgs,
    DepositAccounts,
    TokenInstructionAccounts | TokenInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<DepositArgs, DepositAccounts>) => {
        const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
            config.program.provider.connection,
            config.accounts.assetMint
        );

        const allAccounts = await getTokenInstructionAccounts(
            config.program,
            config.accounts.assetMint,
            assetTokenProgram,
        );

        const setup: TransactionInstruction[] = [];

        const ownerShares = config.program.provider.connection.getAccountInfo(allAccounts.ownerSharesAccount);
        if (!ownerShares) {
            setup.push(
                createAssociatedTokenAccountInstruction(
                    config.program.provider.publicKey,
                    allAccounts.ownerSharesAccount,
                    config.program.provider.publicKey,
                    allAccounts.sharesMint,
                    TOKEN_2022_PROGRAM_ID,
                )
            );
        }

        return {
            accounts: config.strict ? allAccounts : {
                owner: config.program.provider.publicKey,
                lpVault: allAccounts.lpVault,
                assetMint: config.accounts.assetMint,
                assetTokenProgram,
            },
            args: config.args ? new BN(uiAmountToAmount(config.args.amount, mintDecimals))
                : undefined,
            setup
        };
    },
    getMethod: (program) => (args) => program.methods.deposit(args)
};

export async function createDepositInstruction(
    program: Program<WasabiSolana>,
    args: DepositArgs,
    accounts: DepositAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            depositConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function deposit(
    program: Program<WasabiSolana>,
    args: DepositArgs,
    accounts: DepositAccounts,
    strict: boolean = true,
    increaseCompute = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            depositConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
