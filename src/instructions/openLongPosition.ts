//import { Program, BN } from "@coral-xyz/anchor";
//import { TransactionInstruction, PublicKey } from "@solana/web3.js";
//import { PDA, getPermission, getTokenProgram } from "../utils";
//import { WasabiSolana } from "../../idl/wasabi_solana";
//
//export type OpenLongPositionSetupArgs = {
//    /// The nonce of the position
//    nonce: number, // u16
//    /// The minimum amount out required when swapping
//    minTargetAmount: number, // u64
//    /// The initial down payment amount required to open the position 
//    // (is in `currency` for long positions, `collateralCurrency` for short 
//    // positions
//    downPayment: number, // u64
//    /// The total principal amount to be borrowed for the position.
//    principal: number, // u64
//    /// The timestamp when this position request expires as a unixtimestamp
//    expiration: number, // i64
//    /// The fee to be paid for the position
//    fee: number, // u64
//}
//
//export type OpenLongPositionSetupAccounts = {
//    /// Backend authority
//    authority: PublicKey,
//    /// The address of the currency to be paid for the position.
//    /// QUOTE 
//    currency: PublicKey,
//    /// BASE
//    collateral: PublicKey,
//    feeWallet: PublicKey,
//}
//
//export type OpenLongPositionCleanupArgs = {
//    currency: PublicKey,
//}
//
//export type OpenLongPositionCleanupAccounts = {
//    longPool: PublicKey,
//    position: PublicKey,
//}
//
//export async function createOpenLongPositionSetupInstruction(
//    program: Program<WasabiSolana>,
//    args: OpenLongPositionSetupArgs,
//    accounts: OpenLongPositionSetupAccounts,
//): Promise<TransactionInstruction> {
//    const [permission, tokenProgram] = await Promise.all([
//        getPermission(program, accounts.authority),
//        getTokenProgram(program, accounts.currency),
//    ]);
//    const longPool = PDA.getLongPool(accounts.currency, accounts.collateral, program.programId);
//    const lpVault = PDA.getLpVault(accounts.currency, program.programId);
//
//    return program.methods.openLongPositionSetup({
//        nonce: args.nonce,
//        minTargetAmount: new BN(args.minTargetAmount),
//        downPayment: new BN(args.downPayment),
//        principal: new BN(args.principal),
//        expiration: new BN(args.expiration),
//        fee: new BN(args.fee),
//    }).accounts({
//        owner: program.provider.publicKey,
//        lpVault,
//        longPool,
//        collateral: accounts.collateral,
//        currency: accounts.currency,
//        permission,
//        tokenProgram,
//        feeWallet: accounts.feeWallet,
//    }).instruction();
//}
//
//export async function createOpenLongPositionCleanupInstruction(
//    program: Program<WasabiSolana>,
//    args: OpenLongPositionCleanupArgs,
//    accounts: OpenLongPositionCleanupAccounts,
//): Promise<TransactionInstruction> {
//    const tokenProgram = await getTokenProgram(program, args.currency);
//    return program.methods.openLongPositionCleanup()
//        .accounts({
//            owner: program.provider.publicKey,
//            longPool: accounts.longPool,
//            position: accounts.position,
//            tokenProgram,
//        }).instruction();
//}
