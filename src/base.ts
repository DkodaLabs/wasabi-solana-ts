import { Program } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
} from "@solana/web3.js";
import { WasabiSolana } from "./../idl/wasabi_solana";

export interface BaseMethodConfig<TArgs = void, TAccounts = any, TProcessedAccounts = Record<string, PublicKey>> {
    process: (
        program: Program<WasabiSolana>,
        accounts: TAccounts,
        args?: TArgs
    ) => Promise<{
        accounts: TProcessedAccounts,
        args?: any;
    }>;
    getMethod: (program: Program<WasabiSolana>) => (args: any) => any;
}

export async function handleMethodCall<TArgs = void, TAccounts = any, TProgramAccounts = any>(
    program: Program<WasabiSolana>,
    accounts: TAccounts,
    config: BaseMethodConfig<TArgs, TAccounts, TProgramAccounts>,
    mode: 'instruction' | 'transaction',
    args?: TArgs,
    strict: boolean = true
): Promise<TransactionInstruction | TransactionSignature> {
    const processed = await config.process(program, accounts, args);
    const methodBuilder = config.getMethod(program)(processed.args);
    
    if (strict) {
        return mode === 'instruction' 
            ? methodBuilder.accountsStrict(processed.accounts).instruction()
            : methodBuilder.accountsStrict(processed.accounts).rpc();
    }

    return mode === 'instruction'
        ? methodBuilder.accounts(processed.accounts).instruction()
        : methodBuilder.accounts(processed.accounts).rpc();
}
