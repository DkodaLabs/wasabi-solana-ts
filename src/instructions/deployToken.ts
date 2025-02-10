import { Program, BN } from '@coral-xyz/anchor';
import {
    PublicKey,
    Connection,
    SystemProgram,
    TransactionInstruction,
    VersionedTransaction,
    AddressLookupTableAccount,
    AddressLookupTableInstruction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
} from '@solana/spl-token';
import { PDA, getPermission } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export interface DeployerClient {
    sendTransactions: (transactions: VersionedTransaction[]) => Promise<string>;
};

export type DeployTokenArgs = {
};

export type DeployTokenAccounts = {
};

export default async function deployToken(
    program: Program<WasabiSolana>,
    mint: PublicKey,
    deployer: DeployerClient,
): Promise<VersionedTransaction[]> {


}
