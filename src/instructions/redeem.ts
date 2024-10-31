//import { Program, BN } from "@coral-xyz/anchor";
//import {
//    TransactionInstruction,
//    PublicKey,
//    TransactionSignature
//} from "@solana/web3.js";
//import { getTokenProgramAndDecimals } from "../utils";
//import { WasabiSolana } from "../../idl/wasabi_solana";
//import { uiAmountToAmount } from "../utils";
//import { getTokenInstructionAccounts } from "./tokenAccounts";
//
//export type RedeemArgs = {
//    sharesAmount: number, // u64
//}
//
//export type RedeemAccounts = {
//    assetMint: PublicKey,
//}
//
//export async function createRedeemInstruction(
//    program: Program<WasabiSolana>,
//    args: RedeemArgs,
//    accounts: RedeemAccounts,
//    strict: boolean = true
//): Promise<TransactionInstruction> {
//    const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
//        program.provider.connection,
//        accounts.assetMint
//    );
//
//    const amount = uiAmountToAmount(args.sharesAmount, mintDecimals);
//    const redeemAccounts = await getTokenInstructionAccounts(
//        program,
//        accounts.assetMint,
//        assetTokenProgram
//    );
//
//    const methodCall = program.methods.redeem(amount);
//
//    if (strict) {
//        return methodCall.accountsStrict(redeemAccounts).instruction();
//    } else {
//        const {
//            owner,
//            lpVault,
//            assetMint,
//            assetTokenProgram
//        } = redeemAccounts;
//
//        return methodCall.accounts({
//            owner,
//            lpVault,
//            assetMint,
//            assetTokenProgram,
//        }).instruction();
//    }
//}
//
//export async function redeem(
//    program: Program<WasabiSolana>,
//    args: RedeemArgs,
//    accounts: RedeemAccounts,
//    strict: boolean = true
//): Promise<TransactionSignature> {
//    const [assetTokenProgram, mintDecimals] = await getTokenProgramAndDecimals(
//        program.provider.connection,
//        accounts.assetMint
//    );
//
//    const amount = uiAmountToAmount(args.sharesAmount, mintDecimals);
//    const redeemAccounts = await getTokenInstructionAccounts(
//        program,
//        accounts.assetMint,
//        assetTokenProgram
//    );
//
//    const methodCall = program.methods.redeem(amount);
//
//    if (strict) {
//        return methodCall.accountsStrict(redeemAccounts).rpc();
//    } else {
//        const {
//            owner,
//            lpVault,
//            assetMint,
//            assetTokenProgram
//        } = redeemAccounts;
//
//        return methodCall.accounts({
//            owner,
//            lpVault,
//            assetMint,
//            assetTokenProgram,
//        }).rpc();
//    }
//}
