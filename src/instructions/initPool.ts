import { Program } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PDA, getPermission, handleMintsAndTokenProgram } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';
import { MintCache } from '../utils/mintCache';

export type InitPoolAccounts = {
    currency: PublicKey;
    collateral: PublicKey;
    admin: PublicKey;
};

export type InitPoolInstructionAccounts = {
    payer: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
    associatedTokenProgram: PublicKey;
    systemProgram: PublicKey;
};

export async function getInitPoolInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
    pool_type: 'long' | 'short',
    mintCache?: MintCache
): Promise<InitPoolInstructionAccounts> {
    const { currencyMint, collateralMint, currencyTokenProgram, collateralTokenProgram } =
        await handleMintsAndTokenProgram(
            program.provider.connection,
            accounts.currency,
            accounts.collateral,
            { mintCache }
        );

    const pool =
        pool_type === 'long'
            ? PDA.getLongPool(collateralMint, currencyMint)
            : PDA.getShortPool(collateralMint, currencyMint);

    return {
        payer: program.provider.publicKey,
        authority: accounts.admin,
        permission: await getPermission(program, accounts.admin),
        collateral: collateralMint,
        currency: currencyMint,
        pool,
        collateralVault: getAssociatedTokenAddressSync(
            collateralMint,
            pool,
            true,
            collateralTokenProgram
        ),
        currencyVault: getAssociatedTokenAddressSync(
            currencyMint,
            pool,
            true,
            currencyTokenProgram
        ),
        collateralTokenProgram,
        currencyTokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId
    };
}
