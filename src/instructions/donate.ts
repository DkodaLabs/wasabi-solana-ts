import { Program, BN } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    PublicKey,
    TransactionSignature,
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs
} from "../base";
import { PDA, uiAmountToAmount, getTokenProgramAndDecimals } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type DonateArgs = {
    amount: number // u64
}

export type DonateAccounts = {
    currency: PublicKey,
}

type DonateInstructionAccounts = {
    owner: PublicKey,
    lpVault: PublicKey,
    currency: PublicKey,
    tokenProgram: PublicKey,
}

type DonateIntructionAccountsStrict = {
    ownerAssetAccount: PublicKey,
    vault: PublicKey,
} & DonateInstructionAccounts;

const donateConfig: BaseMethodConfig<
    DonateArgs,
    DonateAccounts,
    DonateInstructionAccounts | DonateIntructionAccountsStrict
> = {
    process: async (config: ConfigArgs<DonateArgs, DonateAccounts>) => {
        const [tokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
            config.program.provider.connection,
            config.accounts.currency
        );

        const lpVault = PDA.getLpVault(config.accounts.currency);

        const allAccounts = {
            owner: config.program.provider.publicKey,
            ownerAssetAccount: getAssociatedTokenAddressSync(
                config.accounts.currency,
                config.program.provider.publicKey,
                false,
                tokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                lpVault,
                true,
                tokenProgram
            ),
            currency: config.accounts.currency,
            tokenProgram,
        };
        return {
            accounts: config.strict ? allAccounts : {
                owner: allAccounts.owner,
                lpVault,
                currency: config.accounts.currency,
                tokenProgram,
            },
            args: config.args ? new BN(uiAmountToAmount(config.args.amount, mintDecimals)) : undefined,
        };
    },
    getMethod: (program) => (args) => program.methods.donate(args),
}

export async function createDonateInstruction(
    program: Program<WasabiSolana>,
    args: DonateArgs,
    accounts: DonateAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            donateConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function donate(
    program: Program<WasabiSolana>,
    args: DonateArgs,
    accounts: DonateAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            donateConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
