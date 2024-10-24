import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getPermission, getTokenProgram } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type OpenShortPositionSetupArgs = {
    /// The nonce of the position
    nonce: number, // u16
    /// The minimum amount out required when swapping
    minTargetAmount: number, // u64
    /// The initial down payment amount required to open the position 
    // (is in `currency` for long positions, `collateralCurrency` for short 
    // positions
    downPayment: number, // u64
    /// The total principal amount to be borrowed for the position.
    principal: number, // u64
    /// The timestamp when this position request expires as a unixtimestamp
    expiration: number, // i64
    /// The fee to be paid for the position
    fee: number, // u64
}

export type OpenShortPositionSetupAccounts = {
    /// Backend authority
    authority: PublicKey,
    /// The address of the currency to be paid for the position.
    currency: PublicKey,
    collateral: PublicKey,
    shortPool: PublicKey,
    permission: PublicKey,
    feeWallet: PublicKey,
}

export type OpenShortPositionCleanupAccounts = {
    shortPool: PublicKey,
    position: PublicKey,
}

export type OpenShortPositionCleanupArgs = {
    currency: PublicKey,
}

export async function createOpenShortPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenShortPositionSetupArgs,
    accounts: OpenShortPositionSetupAccounts,
): Promise<TransactionInstruction> {
    const [permission, collateralTokenProgram, currencyTokenProgram] =
        await Promise.all([
            getPermission(program, accounts.authority),
            getTokenProgram(program, accounts.collateral),
            getTokenProgram(program, accounts.currency),
        ]);

    return program.methods.openShortPositionSetup({
        nonce: args.nonce,
        minTargetAmount: new BN(args.minTargetAmount),
        downPayment: new BN(args.downPayment),
        principal: new BN(args.principal),
        expiration: new BN(args.expiration),
        fee: new BN(args.fee),
    }).accounts({
        owner: program.provider.publicKey,
        lpVault: PDA.getLpVault(accounts.currency, program.programId),
        shortPool: accounts.shortPool,
        collateral: accounts.collateral,
        currency: accounts.currency,
        permission,
        feeWallet: accounts.feeWallet,
        collateralTokenProgram,
        currencyTokenProgram,
    }).instruction();
}

export async function createOpenShortPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    args: OpenShortPositionCleanupArgs,
    accounts: OpenShortPositionCleanupAccounts,
): Promise<TransactionInstruction> {
    const tokenProgram = await getTokenProgram(program, args.currency);
    return program.methods.openShortPositionCleanup()
        .accounts({
            owner: program.provider.publicKey,
            shortPool: accounts.shortPool,
            position: accounts.position,
            tokenProgram,
        }).instruction();
}
