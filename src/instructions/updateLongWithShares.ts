import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { createPositionMethodBuilder, processPositionInstruction, UpdateWithSharesInstructionAccounts } from './shared';
import { MintCache } from '../utils';
import { Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';

const updateLongWithShares: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    UpdateWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        return processPositionInstruction<UpdateWithSharesInstructionAccounts>(config, {
            useShares: true,
            isUpdate: true,
            methodName: 'UpdateLongWithShares'
        });
    },
    getMethod: createPositionMethodBuilder('updateLongWithShares', true)
};

export async function createUpdateLongWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: updateLongWithShares,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
