import { Program, BN } from "@coral-xyz/anchor";
import {
    TransactionSignature,
    TransactionInstruction,
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

export type SetMaxApyArgs = {
    maxApy: number // u64
}

export type SetMaxApyAccounts = {
    authority: PublicKey,
}

type SetMaxApyInstructionAccounts = SetMaxApyAccounts;
type SetMaxApyInstructionAccountsStrict = {
    superAdminPermission: PublicKey,
    debtController: PublicKey,
} & SetMaxApyInstructionAccounts;

const setMaxApyConfig: BaseMethodConfig<
    SetMaxApyArgs,
    SetMaxApyAccounts,
    SetMaxApyInstructionAccounts | SetMaxApyInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<SetMaxApyArgs, SetMaxApyAccounts>) => {
        const allAccounts = {
            authority: config.accounts.authority,
            superAdminPermission: PDA.getSuperAdmin(),
            debtController: PDA.getDebtController(),
        };

        return {
            accounts: config.strict ? allAccounts : {
                authority: config.accounts.authority,
            },
            args: config.args ? new BN(config.args.maxApy) : undefined,
        }
    },
    getMethod: (program) => (args) => program.methods.setMaxApy(args),
};

export async function createDepositInstruction(
    program: Program<WasabiSolana>,
    args: SetMaxApyArgs,
    accounts: SetMaxApyAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            setMaxApyConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function deposit(
    program: Program<WasabiSolana>,
    args: SetMaxApyArgs,
    accounts: SetMaxApyAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            setMaxApyConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
