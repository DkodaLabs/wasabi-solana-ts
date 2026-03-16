import { ConfigArgs } from '../base';
import { RemoveCollateralAccounts, RemoveCollateralArgs } from './removeCollateralFromShortPosition';
import { TransactionInstruction } from '@solana/web3.js';
import { processRemoveCollateralInstruction } from './shared';

export async function processRemoveCollateralFromLongInstruction(
    config: ConfigArgs<RemoveCollateralArgs, RemoveCollateralAccounts>
): Promise<TransactionInstruction[]> {
    return processRemoveCollateralInstruction(config, { isLong: true });
}

