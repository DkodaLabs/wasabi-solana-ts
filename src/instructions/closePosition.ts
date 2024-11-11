import { Program, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PDA, getPermission } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type ClosePositionSetupArgs = {
    /// The minimum amount out required when swapping
    minTargetAmount: number; // u64
    /// The amount of interest the user must pay
    interest: number; // u64
    /// The amount of the execution fee to be paid
    executionFee: number; // u64
    /// The unixtimestamp when this close position request expires
    expiration: number; // i64
};

export type ClosePositionSetupAccounts = {
    authority: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
};

export type ClosePositionSetupInstructionAccounts = {
    owner: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateral: PublicKey;
    permission: PublicKey;
    tokenProgram: PublicKey;
};

export type ClosePositionSetupInstructionAccountsStrict = {
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    authority: PublicKey;
    closePositionRequest: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
} & ClosePositionSetupInstructionAccounts;

export type ClosePositionCleanupAccounts = {
    authority: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    feeWallet: PublicKey;
};

export type ClosePositionCleanupInstructionAccounts = {
    owner: PublicKey;
    authority: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    position: PublicKey;
    feeWallet: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
};

export type ClosePositionCleanupInstructionAccountsStrict = {
    ownerCollateralAccount: PublicKey;
    ownerCurrencyAccount: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    closePositionRequest: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
} & ClosePositionCleanupInstructionAccounts;

export function transformArgs(args: ClosePositionSetupArgs): {
    minTargetAmount: BN;
    interest: BN;
    executionFee: BN;
    expiration: BN;
} {
    return {
        minTargetAmount: new BN(args.minTargetAmount),
        interest: new BN(args.interest),
        executionFee: new BN(args.executionFee),
        expiration: new BN(args.expiration)
    };
}

export async function getClosePositionSetupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionSetupAccounts
): Promise<ClosePositionSetupInstructionAccountsStrict> {
    const [owner, collateralTokenProgram, currencyTokenProgram] = await Promise.all([
        program.account.position.fetch(accounts.position).then((pos) => pos.trader),
        program.provider.connection.getAccountInfo(accounts.collateral).then((acc) => acc.owner),
        program.provider.connection.getAccountInfo(accounts.currency).then((acc) => acc.owner)
    ]);
    return {
        owner,
        position: accounts.position,
        pool: accounts.pool,
        collateralVault: getAssociatedTokenAddressSync(
            accounts.collateral,
            accounts.pool,
            true,
            collateralTokenProgram
        ),
        currencyVault: getAssociatedTokenAddressSync(
            accounts.currency,
            accounts.pool,
            true,
            currencyTokenProgram
        ),
        collateral: accounts.collateral,
        authority: accounts.authority,
        permission: await getPermission(program, accounts.authority),
        closePositionRequest: PDA.getClosePositionRequest(owner),
        tokenProgram: collateralTokenProgram,
        systemProgram: SystemProgram.programId,
        sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
    };
}

export async function getClosePositionCleanupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts
): Promise<ClosePositionCleanupInstructionAccountsStrict> {
    const [[owner, lpVault], collateralTokenProgram, currencyTokenProgram] = await Promise.all([
        program.account.position.fetch(accounts.position).then((pos) => [pos.trader, pos.lpVault]),
        program.provider.connection.getAccountInfo(accounts.collateral).then((acc) => acc.owner),
        program.provider.connection.getAccountInfo(accounts.currency).then((acc) => acc.owner)
    ]);
    const vault = await program.account.lpVault.fetch(lpVault).then((lpVault) => lpVault.vault);

    return {
        owner,
        ownerCollateralAccount: getAssociatedTokenAddressSync(
            accounts.collateral,
            owner,
            false,
            collateralTokenProgram
        ),
        ownerCurrencyAccount: getAssociatedTokenAddressSync(
            accounts.currency,
            owner,
            false,
            currencyTokenProgram
        ),
        pool: accounts.pool,
        collateralVault: getAssociatedTokenAddressSync(
            accounts.collateral,
            accounts.pool,
            true,
            collateralTokenProgram
        ),
        currencyVault: getAssociatedTokenAddressSync(
            accounts.collateral,
            accounts.pool,
            true,
            currencyTokenProgram
        ),
        currency: accounts.currency,
        collateral: accounts.collateral,
        closePositionRequest: PDA.getClosePositionRequest(owner),
        position: accounts.position,
        authority: accounts.authority,
        lpVault,
        vault,
        feeWallet: accounts.feeWallet,
        debtController: PDA.getDebtController(),
        globalSettings: PDA.getGlobalSettings(),
        currencyTokenProgram,
        collateralTokenProgram
    };
}
