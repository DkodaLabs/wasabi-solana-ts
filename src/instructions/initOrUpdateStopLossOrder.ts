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

export type InitOrUpdateStopLossArgs = {
    makerAmount: number | bigint; // u64
    takerAmount: number | bigint; // u64
};

export type InitOrUpdateStopLossAccounts = {
    position: PublicKey;
};

type InitOrUpdateStopLossInstructionAccounts = {
    trader: PublicKey;
    position: PublicKey;
};

type InitOrUpdateStopLossInstructionAccountsStrict = {
    stopLossOrder: PublicKey;
    systemProgram: PublicKey;
} & InitOrUpdateStopLossInstructionAccounts;

const initOrUpdateStopLossConfig: BaseMethodConfig<
    InitOrUpdateStopLossArgs,
    InitOrUpdateStopLossAccounts,
    InitOrUpdateStopLossInstructionAccounts | InitOrUpdateStopLossInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitOrUpdateStopLossArgs, InitOrUpdateStopLossAccounts>) => {
        const trader = await config.program.account.position
            .fetch(config.accounts.position)
            .then((pos) => pos.trader);
        const allAccounts = {
            trader,
            position: config.accounts.position,
            stopLossOrder: PDA.getStopLossOrder(config.accounts.position),
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
                makerAmount: new BN(config.args.makerAmount.toString()),
                takerAmount: new BN(config.args.takerAmount.toString())
            }
        };
    },
    getMethod: (program) => (args) =>
        program.methods.initOrUpdateStopLossOrder(args.makerAmount, args.takerAmount)
};

export function createInitOrUpdateStopLossInstruction(
    program: Program<WasabiSolana>,
    args: InitOrUpdateStopLossArgs,
    accounts: InitOrUpdateStopLossAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdateStopLossConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export function initOrUpdateStopLoss(
    program: Program<WasabiSolana>,
    args: InitOrUpdateStopLossArgs,
    accounts: InitOrUpdateStopLossAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdateStopLossConfig,
            'TRANSACTION',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
