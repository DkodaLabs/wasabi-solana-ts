import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    TransactionSignature,
    ComputeBudgetProgram,
    PublicKey
} from '@solana/web3.js';
import { WasabiSolana } from '../idl/wasabi_solana';

const COMPUTE_VALUES = {
    LIMIT: {
        TOKEN: 200_000,
        TRADE: 500_000,
    },
    PRICE: {
        NORMAL: 50_000,
        FAST: 100_000,
        TURBO: 1_000_000,
    },
};

export type IxAccountsStrictness = 'NO_STRICT' | 'PARTIAL' | 'STRICT';
export type BuildMode = 'TRANSACTION' | 'INSTRUCTION';
export type Level = 'NORMAL' | 'FAST' | 'TURBO';
type FeeLevel = {
    level: Level,
    ixType: 'VAULT' | 'TRADE';
};

export type ProcessResult<T> = {
    accounts: T;
    args?: any;
    setup?: TransactionInstruction[];
    cleanup?: TransactionInstruction[];
};

export type ConfigArgs<TArgs, TAccounts> = {
    program: Program<WasabiSolana>;
    accounts: TAccounts;
    feeLevel?: FeeLevel;
    args?: TArgs;
};

export type MethodCallArgs<TArgs, TAccounts, TProgramAccounts> = {
    config: BaseMethodConfig<TArgs, TAccounts, TProgramAccounts>;
    mode: BuildMode,
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
        feeLevel: args.feeLevel,
        args: args.args
    });
    const methodBuilder = args.config.getMethod(args.program)(processed.args);

    const builder = methodBuilder.accountsStrict(processed.accounts);

    builder.preInstructions([
        args.feeLevel ? getComputeIxes(args.feeLevel) : [],
        ...(processed.setup || []),
    ]);

    return args.mode === 'INSTRUCTION'
        ? builder
            .instruction()
            .then((ix: TransactionInstruction) => {
                const ixes =
                    [
                        ...(processed.setup || []),
                        ix,
                        ...(processed.cleanup || [])
                    ];
                return ixes;
            })
        : builder.rpc();
}

export function constructMethodCallArgs<TArgs = void, TAccounts = any, TProgramAccounts = any>(
    program: Program<WasabiSolana>,
    accounts: TAccounts,
    config: BaseMethodConfig<TArgs, TAccounts, TProgramAccounts>,
    mode: BuildMode,
    feeLevel?: FeeLevel,
    args?: TArgs
): MethodCallArgs<TArgs, TAccounts, TProgramAccounts> {
    return {
        program,
        accounts,
        config,
        mode,
        feeLevel,
        args
    };
}

function getComputeIxes(feeLevel: FeeLevel): TransactionInstruction[] {
    return [
        ComputeBudgetProgram.setComputeUnitLimit({
            units: COMPUTE_VALUES.LIMIT[feeLevel.level]
        }),
        ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: COMPUTE_VALUES.PRICE[feeLevel.ixType]
        }),
    ];
}
