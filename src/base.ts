import { Program } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
} from "@solana/web3.js";
import { WasabiSolana } from "./../idl/wasabi_solana";

export type MethodResult<T> = {
    accounts: (accounts: T) => {
        instruction(): Promise<TransactionInstruction>;
        rpc(): Promise<TransactionSignature>;
    };
    accountsStrict?: (accounts: T) => {
        instruction(): Promise<TransactionInstruction>,
        rpc(): Promise<TransactionSignature>,
    };
}

export interface BaseMethodConfig<TArgs = void, TAccounts = any, TProcessedArgs = any, TProcessedAccounts = any> {
    processArgs?: (
        args: TArgs,
        program: Program<WasabiSolana>,
        accounts: TAccounts
    ) => Promise<TProcessedArgs>;
    processAccounts: (
        program: Program<WasabiSolana>,
        accounts: TAccounts,
        args?: TArgs
    ) => Promise<TProcessedAccounts>;
    getMethod: (
        program: Program<WasabiSolana>
    ) => (args?: TProcessedArgs) => {
        accounts: (accounts: any) => {
            instruction(): Promise<TransactionInstruction>;
            rpc(): Promise<TransactionSignature>;
        };
        accountsStrict?: (accounts: TProcessedAccounts) => {
            instruction(): Promise<TransactionInstruction>;
            rpc(): Promise<TransactionSignature>;
        };
    };

    getRequiredAccounts?: (processedAccounts: TProcessedAccounts) => Record<string, PublicKey>;
}

export async function handleMethodCall<TArgs = void, TAccounts = any, TProcessedArgs = any, TProcessedAccounts = any>(
    program: Program<WasabiSolana>,
    accounts: TAccounts,
    config: BaseMethodConfig<TArgs, TAccounts, TProcessedArgs, TProcessedAccounts>,
    mode: 'instruction' | 'transaction',
    args?: TArgs,
    strict: boolean = true
): Promise<TransactionInstruction | TransactionSignature> {
    const processedAccounts = await config.processAccounts(program, accounts, args);
    const processedArgs = args && config.processArgs 
        ? await config.processArgs(args, program, accounts) 
        : undefined;
    
    const method = config.getMethod(program);
    const methodCall = method(processedArgs as TProcessedArgs);
    
    if (strict && methodCall.accountsStrict) {
        return mode === 'instruction' 
            ? methodCall.accountsStrict(processedAccounts).instruction()
            : methodCall.accountsStrict(processedAccounts).rpc();
    }

    const requiredAccounts = config.getRequiredAccounts 
        ? config.getRequiredAccounts(processedAccounts)
        : processedAccounts;

    return mode === 'instruction'
        ? methodCall.accounts(requiredAccounts).instruction()
        : methodCall.accounts(requiredAccounts).rpc();
}


export async function createInstruction<TArgs = void, TAccounts = any, TProcessedArgs = any, TProcessedAccounts = any>(
    program: Program<WasabiSolana>,
    accounts: TAccounts,
    config: BaseMethodConfig<TArgs, TAccounts, TProcessedArgs, TProcessedAccounts>,
    args?: TArgs,
    strict: boolean = true
): Promise<TransactionInstruction> {
    return handleMethodCall(program, accounts, config, 'instruction', args, strict) as Promise<TransactionInstruction>;
}

export async function executeTransaction<TArgs = void, TAccounts = any, TProcessedArgs = any, TProcessedAccounts = any>(
    program: Program<WasabiSolana>,
    accounts: TAccounts,
    config: BaseMethodConfig<TArgs, TAccounts, TProcessedArgs, TProcessedAccounts>,
    args?: TArgs,
    strict: boolean = true
): Promise<TransactionSignature> {
    return handleMethodCall(program, accounts, config, 'transaction', args, strict) as Promise<TransactionSignature>;
}
