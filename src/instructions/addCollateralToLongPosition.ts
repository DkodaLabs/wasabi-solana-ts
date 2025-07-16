import { ConfigArgs } from '../base';
import { AddCollateralAccounts, AddCollateralArgs } from './addCollateralToShortPosition';
import { TransactionInstruction } from '@solana/web3.js';
import { processAddCollateralInstruction } from './shared';

export async function processAddCollateralToLongInstruction(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    useShares: boolean
): Promise<TransactionInstruction[]> {
    return processAddCollateralInstruction(config, { useShares, isLong: true });
}
