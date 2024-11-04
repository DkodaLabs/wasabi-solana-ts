import { Program, BN } from "@coral-xyz/anchor";
import {
    TransactionSignature,
    TransactionInstruction,
    PublicKey,
    SystemProgram,
} from "@solana/web3.js";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from "../base";
import { PDA } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitStopLossArgs = {
    makerAmount: number, // u64
    takerAmount: number, // u64
}

export type InitStopLossAccounts = {
    position: PublicKey,
}

type InitStopLossInstructionAccounts = {
    trader: PublicKey,
    position: PublicKey,
}

type InitStopLossInstructionAccountsStrict = {
    stopLossOrder: PublicKey,
    systemProgram: PublicKey,
} & InitStopLossInstructionAccounts;

const initStopLossConfig: BaseMethodConfig<
    InitStopLossArgs,
    InitStopLossAccounts,
    InitStopLossInstructionAccounts | InitStopLossInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitStopLossArgs, InitStopLossAccounts>) => {
        const trader = await config.program.account.position.fetch(config.accounts.position).then(pos => pos.trader);
        const allAccounts = {
            trader,
            position: config.accounts.position,
            stopLossOrder: PDA.getStopLossOrder(config.accounts.position),
            systemProgram: SystemProgram.programId,
        };

        return {
            accounts: config.strict ? allAccounts : {
                trader,
                position: allAccounts.position,
            },
            args: {
                makerAmount: new BN(config.args.makerAmount),
                takerAmount: new BN(config.args.takerAmount),
            }
        };
    },
    getMethod: (program) => (args) => program.methods.initStopLossOrder(args.makerAmount, args.takerAmount),
};

export function createInitStopLossInstruction(
    program: Program<WasabiSolana>,
    args: InitStopLossArgs,
    accounts: InitStopLossAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initStopLossConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export function initStopLoss(
    program: Program<WasabiSolana>,
    args: InitStopLossArgs,
    accounts: InitStopLossAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initStopLossConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
