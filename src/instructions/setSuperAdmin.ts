import { Program } from '@coral-xyz/anchor';
import { 
    PublicKey, 
    TransactionSignature, 
    TransactionInstruction 
} from '@solana/web3.js';
import { WasabiSolana } from '../idl/wasabi_solana';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from '../base';
import { PDA } from '../utils';

export type SuperAdminArgs = {
    allow_trading: boolean;
};

export type SuperAdminAccounts = {
    authority: PublicKey;
}

type SuperAdminInstructionAccounts = SuperAdminAccounts;

type SuperAdminInstructionAccountsStrict = {
    authority: PublicKey,
    superAdmin: PublicKey,
};


const tradeStateConfig: BaseMethodConfig<
    SuperAdminArgs,
    SuperAdminAccounts,
    SuperAdminInstructionAccounts | SuperAdminInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<SuperAdminArgs, SuperAdminAccounts>) => {
        const allAccounts = {
            authority: config.accounts.authority,
            superAdmin: PDA.getSuperAdmin()
        };

        return {
            accounts: config.strict ? allAccounts : {
                authority: allAccounts.authority,
            },
            args: config.args.allow_trading
        };

    },
    getMethod: (program) => (args) => program.methods.setSuperAdmin(args),
};

export async function createSetSuperAdminInstruction(
    program: Program<WasabiSolana>,
    args: SuperAdminArgs,
    accounts: SuperAdminAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            tradeStateConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function setSuperAdmin(
    program: Program<WasabiSolana>,
    args: SuperAdminArgs,
    accounts: SuperAdminAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            tradeStateConfig,
            'TRANSACTION',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}

