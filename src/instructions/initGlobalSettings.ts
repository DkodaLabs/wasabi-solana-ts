import { Program } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey, SystemProgram } from "@solana/web3.js";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from "../base";
import { PDA } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

//TODO: CHECK
export type InitGlobalSettingsArgs = {
    superAdmin: PublicKey,
    feeWallet: PublicKey,
    statuses: number, // u16
}

type InitGlobalSettingsInstructionAccounts = {
    payer: PublicKey,
}

type InitGlobalSettingsInstructionAccountsStrict = {
    globalSettings: PublicKey,
    superAdminPermission: PublicKey,
    systemProgram: PublicKey,
} & InitGlobalSettingsInstructionAccounts;

const initGlobalSettingsConfig: BaseMethodConfig<
    InitGlobalSettingsArgs,
    void,
    InitGlobalSettingsInstructionAccounts | InitGlobalSettingsInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitGlobalSettingsArgs, void>) => {
        const allAccounts = {
            payer: config.program.provider.publicKey,
            globalSettings: PDA.getGlobalSettings(),
            superAdminPermission: PDA.getSuperAdmin(),
            systemProgram: SystemProgram.programId,
        };

        return {
            accounts: config.strict ? allAccounts : {
                payer: allAccounts.payer,
            },
            args: config.args,
        }
    },
    getMethod: (program) => (args) => program.methods.initGlobalSettings(args),
};

export async function createInitGlobalSettingsInstruction(
    program: Program<WasabiSolana>,
    args: InitGlobalSettingsArgs,
    accounts: void,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initGlobalSettingsConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function initGlobalSettings(
    program: Program<WasabiSolana>,
    args: InitGlobalSettingsArgs,
    accounts: void,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initGlobalSettingsConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}
