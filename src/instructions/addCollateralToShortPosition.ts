import { ConfigArgs } from '../base';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { processAddCollateralInstruction } from './shared';
import { PayInType } from './openPosition';

export type AddCollateralParams = { payInType: PayInType } & AddCollateralArgs & AddCollateralAccounts;

export type AddCollateralArgs = {
    amount: bigint;
    interest: bigint;
    expiration: bigint;
};

export type AddCollateralAccounts = {
    owner: PublicKey;
    position: PublicKey;
    authority?: PublicKey;
};

export async function processAddCollateralToShortInstruction(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    useShares: boolean
): Promise<TransactionInstruction[]> {
    return processAddCollateralInstruction(config, { useShares, isLong: false });
}
