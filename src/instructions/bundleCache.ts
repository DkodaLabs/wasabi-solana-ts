import { PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { PDA } from '../utils';

export type BundleCacheAccounts = {
    payer: PublicKey;
    authority: PublicKey;
};

export type ValidateBundleAccounts = {
    src: PublicKey;
    dst: PublicKey;
} & BundleCacheAccounts;

export type CloseBundleAccounts = ValidateBundleAccounts & {
    tipReceiver: PublicKey;
};

export type BaseBundleCacheInstructionAccounts = {
    payer: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    bundleCache: PublicKey;
};

export type ValidateBundleInstructionAccounts = BaseBundleCacheInstructionAccounts & {
    src: PublicKey;
    dst: PublicKey;
};

export type InitBundleCacheInstructionAccounts = BaseBundleCacheInstructionAccounts & {
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
}

export type CloseBundleCacheInstructionAccounts =
    InitBundleCacheInstructionAccounts & ValidateBundleInstructionAccounts & {
        tipRecipient: PublicKey;
    }

export type InitBundleCacheArgs = {
    numExpectedTx: number;
    srcMaxDelta: bigint;
    dstMinDelta: bigint;
};

export type CloseBundleArgs = {
    tipAmount: bigint;
};

export const getBaseInstructionAccounts = (
    payer: PublicKey,
    authority: PublicKey
): BaseBundleCacheInstructionAccounts => {
    const permission = PDA.getAdmin(authority);
    const bundleCache = PDA.getBundleCache(payer, authority);

    return {
        payer,
        authority,
        permission,
        bundleCache,
    };
}

export const getInitBundleCacheInstructionAccounts = (
    payer: PublicKey,
    authority: PublicKey
): InitBundleCacheInstructionAccounts => {
    const { permission, bundleCache } = getBaseInstructionAccounts(payer, authority);

    return {
        payer,
        authority,
        permission,
        bundleCache,
        systemProgram: SystemProgram.programId,
        sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY,
    };
};
