import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { PDA, validateProviderPubkey, WASABI_PROGRAM_ID } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { WasabiSolana } from '../idl/wasabi_solana';

type TokenArgs = {
    amount: number | bigint;
};

type TokenAccounts = {
    assetMint: PublicKey;
};

type TokenAccountsWithOwner = TokenAccounts & {
    /** Optional override for the owner/payer. Defaults to program.provider.publicKey. */
    owner?: PublicKey;
};

export type TokenInstructionAccounts = {
    owner: PublicKey;
    ownerAssetAccount: PublicKey;
    ownerSharesAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    assetMint: PublicKey;
    sharesMint: PublicKey;
    globalSettings: PublicKey;
    assetTokenProgram: PublicKey;
    sharesTokenProgram: PublicKey;
    eventAuthority: PublicKey;
    program: PublicKey;
};

export type DepositArgs = TokenArgs;
export type WithdrawArgs = TokenArgs;
export type RedeemArgs = TokenArgs;
export type MintArgs = TokenArgs;
export type DepositAccounts = TokenAccountsWithOwner;
export type WithdrawAccounts = TokenAccountsWithOwner;
export type RedeemAccounts = TokenAccounts;
export type MintAccounts = TokenAccounts;

export async function getTokenInstructionAccounts(
    program: Program<WasabiSolana>,
    assetMint: PublicKey,
    assetTokenProgram: PublicKey,
    ownerOverride?: PublicKey
): Promise<TokenInstructionAccounts> {
    const lpVault = PDA.getLpVault(assetMint);
    const vault = getAssociatedTokenAddressSync(assetMint, lpVault, true, assetTokenProgram);
    const sharesMint = PDA.getSharesMint(lpVault, assetMint);
    const payer = ownerOverride ?? validateProviderPubkey(program.provider.publicKey);

    return {
        owner: payer,
        ownerAssetAccount: getAssociatedTokenAddressSync(
            assetMint,
            payer,
            false,
            assetTokenProgram
        ),
        ownerSharesAccount: getAssociatedTokenAddressSync(
            sharesMint,
            payer,
            false,
            TOKEN_2022_PROGRAM_ID
        ),
        lpVault,
        vault,
        assetMint,
        sharesMint,
        globalSettings: PDA.getGlobalSettings(),
        assetTokenProgram,
        sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
        eventAuthority: PDA.getEventAuthority(),
        program: WASABI_PROGRAM_ID
    };
}
