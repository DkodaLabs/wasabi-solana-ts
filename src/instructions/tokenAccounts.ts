import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { PDA, WASABI_PROGRAM_ID } from "../utils";
import { 
    getAssociatedTokenAddressSync, 
    TOKEN_2022_PROGRAM_ID 
} from "@solana/spl-token";
import { WasabiSolana } from "../../idl/wasabi_solana";

export interface AmountArgs {
    amount: number;
}

export interface MintAccounts {
    assetMint: PublicKey;
}

export interface TokenInstructionAccounts {
    owner: PublicKey;
    ownerAssetAccount: PublicKey;
    ownerSharesAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    assetMint: PublicKey;
    sharesMint: PublicKey;
    assetTokenProgram: PublicKey;
    sharesTokenProgram: PublicKey;
    eventAuthority: PublicKey;
    program: PublicKey;
}

export async function getTokenInstructionAccounts(
    program: Program<WasabiSolana>,
    assetMint: PublicKey,
    assetTokenProgram: PublicKey
): Promise<TokenInstructionAccounts> {
    const lpVault = PDA.getLpVault(assetMint);
    const vault = getAssociatedTokenAddressSync(
        assetMint,
        lpVault,
        true,
        assetTokenProgram
    );
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
            TOKEN_2022_PROGRAM_ID,
        ),
        lpVault,
        vault,
        assetMint,
        sharesMint,
        assetTokenProgram,
        sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
        eventAuthority: PDA.getEventAuthority(),
        program: WASABI_PROGRAM_ID,
    };
}
