import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, TransactionSignature, PublicKey } from '@solana/web3.js';
import { WasabiSolana } from './idl/wasabi_solana';

export type ProcessResult<T> = {
    accounts: T;
    args?: any;
    setup?: TransactionInstruction[];
};

export type ConfigArgs<TArgs, TAccounts> = {
    program: Program<WasabiSolana>;
    accounts: TAccounts;
    strict: boolean;
    increaseCompute: boolean;
    args?: TArgs;
};

export type MethodCallArgs<TArgs, TAccounts, TProgramAccounts> = {
    config: BaseMethodConfig<TArgs, TAccounts, TProgramAccounts>;
    mode: 'instruction' | 'transaction';
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
        strict: args.strict,
        increaseCompute: args.increaseCompute,
        args: args.args
    });
    const methodBuilder = args.config.getMethod(args.program)(processed.args);

    const builder = args.strict
        ? methodBuilder.accountsStrict(processed.accounts)
        : methodBuilder.accounts(processed.accounts);

    if (processed.setup) {
        builder.preInstructions(processed.setup);
    }

    return args.mode === 'instruction'
        ? builder
              .instruction()
              .then((ix: TransactionInstruction) => [...(processed.setup || []), ix])
        : builder.rpc();
}

export function constructMethodCallArgs<TArgs = void, TAccounts = any, TProgramAccounts = any>(
    program: Program<WasabiSolana>,
    accounts: TAccounts,
    config: BaseMethodConfig<TArgs, TAccounts, TProgramAccounts>,
    mode: 'instruction' | 'transaction',
    strict: boolean = true,
    increaseCompute: boolean = false,
    args?: TArgs
): MethodCallArgs<TArgs, TAccounts, TProgramAccounts> {
    return {
        program,
        accounts,
        config,
        mode,
        strict,
        increaseCompute,
        args
    };
}
