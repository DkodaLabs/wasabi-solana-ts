import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { Program } from '@coral-xyz/anchor';
import { createPositionMethodBuilder, processPositionInstruction, OpenWithSharesInstructionAccounts } from './shared';
import { MintCache } from '../utils';
import { WasabiSolana } from '../idl';
import { TransactionInstruction } from '@solana/web3.js';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';

const openLongWithShares: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        // TODO: Handle the case where the payment currency is wrapped SOL
        // This is because we should create a wrapped SOL account for the user but neither
        // transfer from the user or sync nat

        return processPositionInstruction<OpenWithSharesInstructionAccounts>(config, {
            useShares: true,
            isUpdate: false,
            methodName: 'OpenLongWithShares'
        });
    },
    getMethod: createPositionMethodBuilder('openLongWithShares', false)
};

export async function createOpenLongWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: openLongWithShares,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
