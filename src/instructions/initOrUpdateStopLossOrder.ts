import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
} from '../base';
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
    stopLossOrder: PublicKey;
    systemProgram: PublicKey;
};

const initOrUpdateStopLossConfig: BaseMethodConfig<
    InitOrUpdateStopLossArgs,
    InitOrUpdateStopLossAccounts,
    InitOrUpdateStopLossInstructionAccounts
> = {
    process: async (config: ConfigArgs<InitOrUpdateStopLossArgs, InitOrUpdateStopLossAccounts>) => {
        const trader = await config.program.account.position
            .fetch(config.accounts.position)
            .then((pos) => pos.trader);
        return {
            accounts: {
                trader,
                position: config.accounts.position,
                stopLossOrder: PDA.getStopLossOrder(config.accounts.position),
                systemProgram: SystemProgram.programId
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
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: initOrUpdateStopLossConfig,
        feeLevel: {
            level: feeLevel,
            ixType: 'VAULT'
        },
        args
    }) as Promise<TransactionInstruction[]>;
}
