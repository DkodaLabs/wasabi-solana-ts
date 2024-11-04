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

export type InitTakeProfitArgs = {
    makerAmount: number, // u64
    takerAmount: number, // u64
}

export type InitTakeProfitAccounts = {
    position: PublicKey,
}

type InitTakeProfitInstructionAccounts = {
    trader: PublicKey,
    position: PublicKey,
}

type InitTakeProfitInstructionAccountsStrict = {
    takeProfitOrder: PublicKey,
    systemProgram: PublicKey,
} & InitTakeProfitInstructionAccounts;

const initTakeProfitConfig: BaseMethodConfig<
    InitTakeProfitArgs,
    InitTakeProfitAccounts,
    InitTakeProfitInstructionAccounts | InitTakeProfitInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<InitTakeProfitArgs, InitTakeProfitAccounts>) => {
        const trader = await config.program.account.position.fetch(config.accounts.position).then(pos => pos.trader);
        const allAccounts = {
            trader,
            position: config.accounts.position,
            stopLossOrder: PDA.getTakeProfitOrder(config.accounts.position),
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
    getMethod: (program) => (args) => program.methods.initTakeProfitOrder(args.makerAmount, args.takerAmount),
};

export function createInitTakeProfitInstruction(
    program: Program<WasabiSolana>,
    args: InitTakeProfitArgs,
    accounts: InitTakeProfitAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initTakeProfitConfig,
            'instruction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export function initTakeProfit(
    program: Program<WasabiSolana>,
    args: InitTakeProfitArgs,
    accounts: InitTakeProfitAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initTakeProfitConfig,
            'transaction',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
