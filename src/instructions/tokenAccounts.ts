import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { PDA, WASABI_PROGRAM_ID } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { WasabiSolana } from '../idl/wasabi_solana';

type TokenArgs = {
    amount: number;
};

type TokenAccounts = {
    assetMint: PublicKey;
};

export type TokenInstructionAccounts = {
    owner: PublicKey;
    lpVault: PublicKey;
    assetMint: PublicKey;
    assetTokenProgram: PublicKey;
};

export type TokenInstructionAccountsStrict = {
    ownerAssetAccount: PublicKey;
    ownerSharesAccount: PublicKey;
    vault: PublicKey;
    sharesMint: PublicKey;
    globalSettings: PublicKey;
    sharesTokenProgram: PublicKey;
    eventAuthority: PublicKey;
    program: PublicKey;
} & TokenInstructionAccounts;

export type DepositArgs = TokenArgs;
export type WithdrawArgs = TokenArgs;
export type RedeemArgs = TokenArgs;
export type MintArgs = TokenArgs;
export type DepositAccounts = TokenAccounts;
export type WithdrawAccounts = TokenAccounts;
export type RedeemAccounts = TokenAccounts;
export type MintAccounts = TokenAccounts;

export async function getTokenInstructionAccounts(
    program: Program<WasabiSolana>,
    assetMint: PublicKey,
    assetTokenProgram: PublicKey
): Promise<TokenInstructionAccountsStrict> {
    const lpVault = PDA.getLpVault(assetMint);
    const vault = getAssociatedTokenAddressSync(assetMint, lpVault, true, assetTokenProgram);
    const sharesMint = PDA.getSharesMint(lpVault, assetMint);

    return {
        owner: program.provider.publicKey,
        ownerAssetAccount: getAssociatedTokenAddressSync(
            assetMint,
            program.provider.publicKey,
            false,
            assetTokenProgram
        ),
        ownerSharesAccount: getAssociatedTokenAddressSync(
            sharesMint,
            program.provider.publicKey,
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
