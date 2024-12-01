import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionSignature,
    TransactionInstruction,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import { PDA } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type InitOrUpdateTakeProfitArgs = {
    makerAmount: number | bigint; // u64
    takerAmount: number | bigint; // u64
};

export type InitOrUpdateTakeProfitAccounts = {
    position: PublicKey;
};

type InitOrUpdateTakeProfitInstructionAccounts = {
    trader: PublicKey;
    position: PublicKey;
    takeProfitOrder: PublicKey;
    systemProgram: PublicKey;
};

const initOrUpdateTakeProfitConfig: BaseMethodConfig<
    InitOrUpdateTakeProfitArgs,
    InitOrUpdateTakeProfitAccounts,
    InitOrUpdateTakeProfitInstructionAccounts
> = {
    process: async (
        config: ConfigArgs<InitOrUpdateTakeProfitArgs, InitOrUpdateTakeProfitAccounts>
    ) => {
        const trader = await config.program.account.position
            .fetch(config.accounts.position)
            .then((pos) => pos.trader);

        return {
            accounts: {
                trader,
                position: config.accounts.position,
                takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position),
                systemProgram: SystemProgram.programId
            },
            args: {
                makerAmount: new BN(config.args.makerAmount.toString()),
                takerAmount: new BN(config.args.takerAmount.toString())
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
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdateTakeProfitConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'VAULT'
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export function initOrUpdateTakeProfit(
    program: Program<WasabiSolana>,
    args: InitOrUpdateTakeProfitArgs,
    accounts: InitOrUpdateTakeProfitAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            initOrUpdateTakeProfitConfig,
            'TRANSACTION',
            {
                level: feeLevel,
                ixType: 'VAULT'
            },
            args
        )
    ) as Promise<TransactionSignature>;
}
