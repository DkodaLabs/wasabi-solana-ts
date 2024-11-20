import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    Connection,
    PublicKey
} from '@solana/web3.js';
import {
    PDA,
    WASABI_PROGRAM_ID,
    isSOL,
    handleSOL,
    getTokenProgram,
    createUnwrapSolInstruction,
    createWrapSolInstruction,
} from '../utils';
import {
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddressSync,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
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

export async function handleWithdrawRedeemUnwrapSol(
    connection: Connection,
    owner: PublicKey,
    assetMint: PublicKey,
    amount: number,
): Promise<{
    assetMint: PublicKey,
    assetTokenProgram: PublicKey,
    setupIx: TransactionInstruction[],
    cleanupIx: TransactionInstruction[],
}> {
    const setup: TransactionInstruction[] = [];
    const cleanup: TransactionInstruction[] = [];
    let assetTokenProgram: PublicKey;

    if (isSOL(assetMint)) {
        const { setupIx, cleanupIx } = await createUnwrapSolInstruction(
            connection,
            owner,
            amount
        );
        setup.push(...setupIx);
        cleanup.push(...cleanupIx);
        const { tokenProgram, nativeMint } = handleSOL();
        assetTokenProgram = tokenProgram;
        assetMint = nativeMint;
    } else {
        assetTokenProgram = await getTokenProgram(
            connection,
            assetMint,
        );
        const ownerAssetAta = getAssociatedTokenAddressSync(
            assetMint,
            owner,
            false,
            assetTokenProgram
        );
        const ownerAssetAccount = await connection.getAccountInfo(ownerAssetAta);
        if (!ownerAssetAccount) {
            setup.push(
                createAssociatedTokenAccountInstruction(
                    owner,
                    ownerAssetAta,
                    owner,
                    assetMint,
                    assetTokenProgram,
                )
            );
        }
    }

    return {
        assetMint,
        assetTokenProgram,
        setupIx: setup,
        cleanupIx: cleanup,
    }
}

export async function handleDepositMintWrapSol(
    connection: Connection,
    owner: PublicKey,
    assetMint: PublicKey,
    amount: number,
): Promise<{
    assetMint: PublicKey,
    assetTokenProgram: PublicKey,
    setupIx: TransactionInstruction[],
    cleanupIx: TransactionInstruction[],
}> {
    const setup: TransactionInstruction[] = [];
    const cleanup: TransactionInstruction[] = [];
    let assetTokenProgram: PublicKey;
    if (isSOL(assetMint)) {
        const { setupIx, cleanupIx } = await createWrapSolInstruction(
            connection,
            owner,
            amount
        );
        setup.push(...setupIx);
        cleanup.push(...cleanupIx);
        const { tokenProgram, nativeMint } = handleSOL();
        assetTokenProgram = tokenProgram;
        assetMint = nativeMint;
    } else {
        assetTokenProgram = await getTokenProgram(
            connection,
            assetMint
        );
    }

    return {
        assetMint,
        assetTokenProgram,
        setupIx: setup,
        cleanupIx: cleanup,
    }
}
