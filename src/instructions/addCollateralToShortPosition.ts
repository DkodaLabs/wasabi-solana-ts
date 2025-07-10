import { ConfigArgs } from '../base';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { processAddCollateralInstruction as sharedProcessAddCollateralInstruction } from './shared';

export type AddCollateralArgs = {
    downPayment: bigint;
    interest: bigint;
    expiration: bigint;
};

export type AddCollateralAccounts = {
    owner: PublicKey;
    position: PublicKey;
};

export type AddCollateralToShortInstructionAccounts = {
    owner: PublicKey;
    ownerTargetCurrencyAccount: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    collateral: PublicKey;
    globalSettings: PublicKey;
    collateralTokenProgram: PublicKey;
};

export async function processAddCollateralToShortInstruction(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    useShares: boolean,
): Promise<TransactionInstruction[]> {
    return sharedProcessAddCollateralInstruction(config, { useShares, isLong: false });
}
