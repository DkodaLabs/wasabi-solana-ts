import { PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { PDA } from '../utils';

export type BundleRequestAccounts = {
    payer: PublicKey;
    authority: PublicKey;
};

export type BundleCleanupAccounts = BundleRequestAccounts & {
    reciprocal: PublicKey;
    tipAccount: PublicKey;
};

export type BundleRequestInstructionAccounts = {
    payer: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    bundleRequest: PublicKey;
};

export type BundleSetupInstructionAccounts = BundleRequestInstructionAccounts & {
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
}

export type BundleCleanupInstructionAccounts =
    BundleSetupInstructionAccounts & {
        reciprocal: PublicKey;
        tipAccount: PublicKey;
    }

export type BundleSetupArgs = {
    numExpectedTxns: number;
    reciprocal: PublicKey;
};

export type BundleCleanupArgs = {
    tipAmount: bigint;
};

export const getBaseInstructionAccounts = (
    payer: PublicKey,
    authority: PublicKey
): BundleRequestInstructionAccounts => {
    const permission = PDA.getAdmin(authority);
    const bundleRequest = PDA.getBundleRequest(payer, authority);

    return {
        payer,
        authority,
        permission,
        bundleRequest,
    };
}

export const getBundleInstructionAccounts = (
    payer: PublicKey,
    authority: PublicKey
): BundleSetupInstructionAccounts => {
    const { permission, bundleRequest } = getBaseInstructionAccounts(payer, authority);

    return {
        payer,
        authority,
        permission,
        bundleRequest,
        systemProgram: SystemProgram.programId,
        sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY,
    };
};
