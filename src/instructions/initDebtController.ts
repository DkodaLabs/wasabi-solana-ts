import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey, SystemProgram } from "@solana/web3.js";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs
} from "../base";
import { getPermission, PDA } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitDebtControllerArgs = {
    maxApy: number, // u64
    maxLeverage: number, // u64
};

export type InitDebtControllerAccounts = {
    authority: PublicKey,
};

type InitDebtControllerInstructionAccounts = {
    superAdmin: PublicKey,
};

type InitDebtControllerInstructionAccountsStrict = {
    authority: PublicKey,
    debtController: PublicKey,
    systemProgram: PublicKey,
} & InitDebtControllerInstructionAccounts;

export const initDebtControllerConfig: BaseMethodConfig<
    InitDebtControllerArgs,
    InitDebtControllerAccounts,
    InitDebtControllerInstructionAccounts | InitDebtControllerInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitDebtControllerArgs, InitDebtControllerAccounts>) => {
        const allAccounts = {
            authority: config.accounts.authority,
            superAdmin: await getPermission(config.program, config.accounts.authority),
            debtController: PDA.getDebtController(),
            systemProgram: SystemProgram.programId,
        };

        return {
            accounts: config.strict ? allAccounts : {
                superAdmin: allAccounts.superAdmin,
            },
            args: { maxApy: new BN(config.args.maxApy), maxLeverage: new BN(config.args.maxLeverage) },
        };
    },
    getMethod: (program) => (args) => program.methods.initDebtController(args.maxApy, args.maxLeverage)
};

export async function createInitDebtControllerInstruction(
    program: Program<WasabiSolana>,
    args: InitDebtControllerArgs,
    accounts: InitDebtControllerAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initDebtControllerConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initDebtController(
    program: Program<WasabiSolana>,
    args: InitDebtControllerArgs,
    accounts: InitDebtControllerAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initDebtControllerConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}


