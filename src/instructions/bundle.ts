import { PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { PDA } from '../utils';

export type BundleRequestAccounts = {
    payer: PublicKey;
    authority: PublicKey;
};

export type ValidateBundleAccounts = {
    src: PublicKey;
    dst: PublicKey;
} & BundleRequestAccounts;

export type BundleCleanupAccounts = ValidateBundleAccounts & {
    tipReceiver: PublicKey;
};

export type BaseBundleRequestInstructionAccounts = {
    payer: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    bundleRequest: PublicKey;
};

export type ValidateBundleInstructionAccounts = BaseBundleRequestInstructionAccounts & {
    src: PublicKey;
    dst: PublicKey;
};

export type BundleSetupInstructionAccounts = BaseBundleRequestInstructionAccounts & {
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
}

export type BundleCleanupInstructionAccounts =
    BundleSetupInstructionAccounts & ValidateBundleInstructionAccounts & {
        tipRecipient: PublicKey;
    }

export type BundleSetupArgs = {
    numExpectedTx: number;
    srcMaxDelta: bigint;
    dstMinDelta: bigint;
};

export type BundleCleanupArgs = {
    tipAmount: bigint;
};

export const getBaseInstructionAccounts = (
    payer: PublicKey,
    authority: PublicKey
): BaseBundleRequestInstructionAccounts => {
    const permission = PDA.getAdmin(authority);
    const bundleRequest = PDA.getBundleRequest(payer, authority);

    return {
        payer,
        authority,
        permission,
        bundleRequest,
    };
}

export const getBundleSetupInstructionAccounts = (
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
