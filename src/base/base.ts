import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
    AccountMeta
} from '@solana/web3.js';
import { WasabiSolana } from '../idl/wasabi_solana';

export type ProcessResult<T> = {
    accounts: T;
    args?: any;
    remainingAccounts?: AccountMeta[];
    setup?: TransactionInstruction[];
    cleanup?: TransactionInstruction[];
};

export type ConfigArgs<TArgs, TAccounts> = {
    program: Program<WasabiSolana>;
    accounts: TAccounts;
    args?: TArgs;
};

export type MethodCallArgs<TArgs, TAccounts, TProgramAccounts> = {
    config: BaseMethodConfig<TArgs, TAccounts, TProgramAccounts>;
} & ConfigArgs<TArgs, TAccounts>;

export type BaseMethodConfig<
    TArgs = void,
    TAccounts = any,
    TProcessedAccounts = Record<string, PublicKey>
> = {
    process: (config: ConfigArgs<TArgs, TAccounts>) => Promise<ProcessResult<TProcessedAccounts>>;
    getMethod: (program: Program<WasabiSolana>) => (args: any) => any;
};

export async function handleMethodCall<TArgs = void, TAccounts = any, TProgramAccounts = any>(
    args: MethodCallArgs<TArgs, TAccounts, TProgramAccounts>
): Promise<TransactionInstruction[] | TransactionSignature> {
    const processed = await args.config.process({
        program: args.program,
        accounts: args.accounts,
        args: args.args
    });
    const methodBuilder = args.config.getMethod(args.program)(processed.args);

    const accounts = methodBuilder.accounts(processed.accounts);

    let builder = methodBuilder.accountsStrict(accounts);

    if (processed.remainingAccounts.length > 0) {
        builder = builder.remainingAccounts(processed.remainingAccounts);
    }

    return builder.instruction().then((ix: TransactionInstruction) => {
        const ixes = [
            ...(processed.setup || []),
            ix,
            ...(processed.cleanup || [])
        ];
        return ixes;
    })
}
