import { Program, BN } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey
} from "@solana/web3.js";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from "../base";
import { PDA } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type SetMaxLeverageArgs = {
    maxLeverage: number, // u64
}

export type SetMaxLeverageAccounts = {
    authority: PublicKey,
}

type SetMaxLeverageInstructionAccounts = SetMaxLeverageAccounts;
type SetMaxLeverageInstructionAccountsStrict = {
    superAdminPermission: PublicKey,
    debtController: PublicKey,
} & SetMaxLeverageInstructionAccounts;

const setMaxLeverageConfig: BaseMethodConfig<
    SetMaxLeverageArgs,
    SetMaxLeverageAccounts,
    SetMaxLeverageInstructionAccounts | SetMaxLeverageInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<SetMaxLeverageArgs, SetMaxLeverageAccounts>) => {
        const allAccounts = {
            authority: config.accounts.authority,
            superAdminPermission: PDA.getSuperAdmin(),
            debtController: PDA.getDebtController(),
        };

        return {
            accounts: config.strict ? allAccounts : {
                authority: config.accounts.authority,
            },
            args: config.args ? new BN(config.args.maxLeverage) : undefined,
        }
    },
    getMethod: (program) => (args) => program.methods.setMaxLeverage(args),
};

export async function createSetMaxLeverageInstruction(
    program: Program<WasabiSolana>,
    args: SetMaxLeverageArgs,
    accounts: SetMaxLeverageAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            setMaxLeverageConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function setMaxLeverage(
    program: Program<WasabiSolana>,
    args: SetMaxLeverageArgs,
    accounts: SetMaxLeverageAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            setMaxLeverageConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
