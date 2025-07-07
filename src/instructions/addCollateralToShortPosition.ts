import { Program } from '@coral-xyz/anchor';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { WasabiSolana } from '../idl';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { MintCache } from '../utils';
import { createAddCollateralMethodBuilder, processAddCollateralInstruction } from './shared';

export type AddCollateralArgs = {
    downPayment: number;
    fee: number;
    expiration: number;
};

export type AddCollateralAccounts = {
    owner: PublicKey;
    position: PublicKey;
    feeWallet: PublicKey;
};

export type AddCollateralInstructionAccounts = {
    owner: PublicKey;
    ownerTargetCurrencyAccount: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    collateral: PublicKey;
    feeWallet: PublicKey;
    globalSettings: PublicKey;
    collateralTokenProgram: PublicKey;
};

const addCollateralConfig: BaseMethodConfig<
    AddCollateralArgs,
    AddCollateralAccounts,
    AddCollateralInstructionAccounts
> = {
    process: async (config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>) => {
        return processAddCollateralInstruction<AddCollateralInstructionAccounts>(config, {
            useShares: false,
            methodName: 'AddCollateralToShortPosition'
        });
    },
    getMethod: createAddCollateralMethodBuilder('addCollateralToShortPosition')
};

export async function createAddCollateralToShortPositionInstruction(
    program: Program<WasabiSolana>,
    args: AddCollateralArgs,
    accounts: AddCollateralAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: addCollateralConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
