import { ConfigArgs } from '../base';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { processRemoveCollateralInstruction } from './shared';

export type RemoveCollateralArgs = {
    amount: bigint;
    currentSize: bigint;
    expiration: bigint;
};

export type RemoveCollateralAccounts = {
    owner: PublicKey;
    position: PublicKey;
    authority?: PublicKey;
};

export async function processRemoveCollateralFromShortInstruction(
    config: ConfigArgs<RemoveCollateralArgs, RemoveCollateralAccounts>
): Promise<TransactionInstruction[]> {
    return processRemoveCollateralInstruction(config, { isLong: false });
}

