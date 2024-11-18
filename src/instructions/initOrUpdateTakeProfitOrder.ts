import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionSignature,
    TransactionInstruction,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type InitOrUpdateTakeProfitArgs = {
    makerAmount: number; // u64
    takerAmount: number; // u64
};

export type InitOrUpdateTakeProfitAccounts = {
    position: PublicKey;
};

type InitOrUpdateTakeProfitInstructionAccounts = {
    trader: PublicKey;
    position: PublicKey;
};

type InitOrUpdateTakeProfitInstructionAccountsStrict = {
    takeProfitOrder: PublicKey;
    systemProgram: PublicKey;
} & InitOrUpdateTakeProfitInstructionAccounts;

const initOrUpdateTakeProfitConfig: BaseMethodConfig<
    InitOrUpdateTakeProfitArgs,
    InitOrUpdateTakeProfitAccounts,
    InitOrUpdateTakeProfitInstructionAccounts | InitOrUpdateTakeProfitInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitOrUpdateTakeProfitArgs, InitOrUpdateTakeProfitAccounts>) => {
        const trader = await config.program.account.position
            .fetch(config.accounts.position)
            .then((pos) => pos.trader);
        const allAccounts = {
            trader,
            position: config.accounts.position,
            takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position),
            systemProgram: SystemProgram.programId
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                      trader,
                      position: allAccounts.position
                  },
            args: {
                makerAmount: new BN(config.args.makerAmount),
                takerAmount: new BN(config.args.takerAmount)
            }
        };
    },
    getMethod: (program) => (args) =>
        program.methods.initOrUpdateTakeProfitOrder(args.makerAmount, args.takerAmount)
};

export function createInitOrUpdateTakeProfitInstruction(
    program: Program<WasabiSolana>,
    args: InitOrUpdateTakeProfitArgs,
    accounts: InitOrUpdateTakeProfitAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdateTakeProfitConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export function initOrUpdateTakeProfit(
    program: Program<WasabiSolana>,
    args: InitOrUpdateTakeProfitArgs,
    accounts: InitOrUpdateTakeProfitAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdateTakeProfitConfig,
            'transaction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
