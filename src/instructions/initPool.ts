import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { PDA, getTokenProgram, getPermission } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type InitPoolAccounts = {
    currency: PublicKey,
    collateral: PublicKey,
    admin: PublicKey,
}
export type InitPoolInstructionAccounts = {
    payer: PublicKey,
    permission: PublicKey,
    collateral: PublicKey,
    currency: PublicKey,
    collateralTokenProgram: PublicKey,
    currencyTokenProgram: PublicKey,
}

export type InitPoolInstructionAccountsStrict = {
    authority: PublicKey,
    pool: PublicKey,
    collateralVault: PublicKey,
    currencyVault: PublicKey,
    associatedTokenProgram: PublicKey,
    systemProgram: PublicKey,
} & InitPoolInstructionAccounts;

export async function getInitPoolInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: InitPoolAccounts,
    pool_type: 'long' | 'short'
): Promise<InitPoolInstructionAccountsStrict> {
    const pool = pool_type === 'long' ? PDA.getLongPool(accounts.currency, accounts.collateral) : PDA.getShortPool(accounts.collateral, accounts.currency);
    const [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
        getTokenProgram(program.provider.connection, accounts.collateral),
        getTokenProgram(program.provider.connection, accounts.currency),
    ]);

    return {
        payer: program.provider.publicKey,
        authority: accounts.admin,
        permission: await getPermission(program, accounts.admin),
        collateral: accounts.collateral,
        currency: accounts.currency,
        pool,
        collateralVault: getAssociatedTokenAddressSync(accounts.collateral, pool, true, collateralTokenProgram),
        currencyVault: getAssociatedTokenAddressSync(accounts.currency, pool, true, currencyTokenProgram),
        collateralTokenProgram,
        currencyTokenProgram,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
    };
}
