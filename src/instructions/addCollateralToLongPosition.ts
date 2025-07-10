import { ConfigArgs } from '../base';
import { AddCollateralAccounts, AddCollateralArgs } from './addCollateralToShortPosition';
import { TransactionInstruction } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import { processAddCollateralInstruction as sharedProcessAddCollateralInstruction } from './shared';

export type AddCollateralToLongInstructionAccounts = {
    owner: PublicKey;
    ownerCurrencyAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    currency: PublicKey;
    globalSettings: PublicKey;
    tokenProgram: PublicKey;
};

export async function processAddCollateralToLongInstruction(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    useShares: boolean,
): Promise<TransactionInstruction[]> {
    return sharedProcessAddCollateralInstruction(config, { useShares, isLong: true });
}
