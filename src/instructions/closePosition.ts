import { PublicKey } from "@solana/web3.js";

export type ClosePositionSetupArgs = {
    /// The minimum amount out required when swapping
    minTargetAmount: number, // u64
    /// The unixtimestamp when this close position request expires
    expiration: number, // i64
    /// The amount of interest the user must pay
    interest: number, // u64
    /// The amount of the execution fee to be paid
    executionFee: number, // u64
}

export type ClosePositionSetupAccounts = {
    authority: PublicKey,
    position: PublicKey,
    collateral: PublicKey,
    currency: PublicKey,
}

export type ClosePositionCleanupAccounts = {
    authority: PublicKey,
    position: PublicKey,
    collateral: PublicKey,
    currency: PublicKey,
    feeWallet: PublicKey,
}
