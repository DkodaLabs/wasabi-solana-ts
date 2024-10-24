import { Program, BN } from "@coral-xyz/anchor";
import { TransactionInstruction, PublicKey } from "@solana/web3.js";
import { PDA, getPermission, getTokenProgram } from "../utils";
import { ClosePositionSetupArgs } from "./closePosition";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type LiquidatePositionSetupAccounts = {
    owner: PublicKey,
    authority: PublicKey,
    position: PublicKey,
    collateral: PublicKey,
    pool: PublicKey,
}

export type LiquidatePositionCleanupAccounts = {
    owner: PublicKey,
    authority: PublicKey,
    position: PublicKey,
    collateral: PublicKey,
    currency: PublicKey,
    feeWallet: PublicKey,
    pool: PublicKey,
}

export async function createLiquidatePositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionSetupArgs,
    accounts: LiquidatePositionCleanupAccounts,
): Promise<TransactionInstruction> {
    const [permission, tokenProgram] = await Promise.all([
        getPermission(program, accounts.authority),
        getTokenProgram(program, accounts.collateral),
    ]);

    return program.methods.liquidatePositionSetup({
        minTargetAmount: new BN(args.minTargetAmount),
        expiration: new BN(args.expiration),
        interest: new BN(args.interest),
        executionFee: new BN(args.executionFee),
    }).accounts({
        closePositionSetup: {
            pool: accounts.pool,
            owner: accounts.owner,
            position: accounts.position,
            permission,
            collateral: accounts.collateral,
            tokenProgram,
        }
    }).instruction();
}

export async function createLiquidatePosition(
    program: Program<WasabiSolana>,
    accounts: LiquidatePositionCleanupAccounts,
): Promise<TransactionInstruction> {
    const [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
        getTokenProgram(program, accounts.collateral),
        getTokenProgram(program, accounts.currency),
    ]);

    return program.methods.liquidatePositionCleanup()
        .accounts({
            closePositionCleanup: {
                owner: accounts.owner,
                authority: program.provider.publicKey,
                pool: accounts.pool,
                collateral: accounts.collateral,
                currency: accounts.currency,
                position: accounts.position,
                feeWallet: accounts.feeWallet,
                collateralTokenProgram,
                currencyTokenProgram,
            }
        }).instruction();
}
