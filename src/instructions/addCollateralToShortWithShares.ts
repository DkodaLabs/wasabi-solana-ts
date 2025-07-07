import { Program } from '@coral-xyz/anchor';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl';
import { TransactionInstruction } from '@solana/web3.js';
import { MintCache } from '../utils';
import {
    AddCollateralAccounts,
    AddCollateralArgs,
    AddCollateralInstructionAccounts
} from './addCollateralToShortPosition';
import { createAddCollateralMethodBuilder, processAddCollateralInstruction, AddCollateralWithSharesInstructionAccounts } from './shared';

const addCollateralWithSharesConfig: BaseMethodConfig<
    AddCollateralArgs,
    AddCollateralAccounts,
    AddCollateralWithSharesInstructionAccounts
> = {
    process: async (config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>) => {
        return processAddCollateralInstruction<AddCollateralWithSharesInstructionAccounts>(config, {
            useShares: true,
            methodName: 'AddCollateralToShortWithShares'
        });
    },
    getMethod: createAddCollateralMethodBuilder('addCollateralToShortWithShares')
};

export async function createAddCollateralToShortWithSharesInstruction(
    program: Program<WasabiSolana>,
    args: AddCollateralArgs,
    accounts: AddCollateralAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: addCollateralWithSharesConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
