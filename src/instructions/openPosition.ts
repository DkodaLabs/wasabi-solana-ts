import { PublicKey, TransactionInstruction } from '@solana/web3.js';

// `owner` == `userPubkey` passed in via request
export type OpenPositionParams = {
    currency: PublicKey;
    collateral: PublicKey;
    feeWallet: PublicKey;
} & OpenPositionSetupArgs;

export type OpenPositionSetupArgs = {
    /// The nonce of the position
    nonce?: number; // u16
    /// The position's address
    positionId?: string;
    /// The minimum amount out required when swapping
    minTargetAmount: number; // u64
    /// The initial down payment amount required to open the position
    // (is in `currency` for long positions, `collateralCurrency` for short
    // positions
    downPayment: number; // u64
    /// The total principal amount to be borrowed for the position.
    principal: number; // u64
    /// The fee to be paid for the position
    fee: number; // u64
    /// The timestamp when this position request expires as a unixtimestamp
    expiration: number; // i64
};

export type OpenPositionSetupAccounts = {
    /// Needs to be passed in as we construct the instruction for the user
    owner: PublicKey; // required
    /// Backend authority - this should be program.provider.publicKey since we always
    /// construct the instruction for the user
    //authority: PublicKey,
    /// The address of the currency to be paid for the position.
    /// QUOTE
    currency: PublicKey;
    /// BASE
    collateral: PublicKey;
    feeWallet: PublicKey; // required
};

export type OpenPositionCleanupAccounts = {
    owner: PublicKey; // required
    currency: PublicKey; // required
    collateral: PublicKey; // required
    pool: PublicKey; // derived
    position: PublicKey; // derived
};

export type OpenPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    pool: PublicKey;
    position: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    openPositionRequest: PublicKey;
    tokenProgram: PublicKey;
};

export type OpenPositionSetupInstructionBaseAccounts = {
    owner: PublicKey;
    ownerCurrencyAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    position: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    feeWalletAta: PublicKey;
    globalSettings: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
};


export type OpenPositionArgs = {
    nonce?: number,
    positionId?: string,
    minTargetAmount: number | bigint,
    downPayment: number | bigint,
    principal: number | bigint,
    fee: number | bigint,
    expiration: number | bigint,
    instructions: TransactionInstruction[],
}
export type OpenPositionAccounts = {
    owner: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    authority: PublicKey,
    feeWallet: PublicKey,
};

