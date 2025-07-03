import { TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { createPositionMethodBuilder, processPositionInstruction } from './shared';
import { MintCache } from '../utils';
import { Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';

const updateLongPositionConfig: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenLongPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        return processPositionInstruction<OpenLongPositionInstructionAccounts>(config, {
            useShares: false,
            isUpdate: true,
            methodName: 'UpdateLongPosition'
        });
    },
    getMethod: createPositionMethodBuilder('updateLongPosition', true)
};

export async function createUpdateLongPositionInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: updateLongPositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
