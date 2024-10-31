//import { Program, BN } from "@coral-xyz/anchor";
//import {
//    TransactionInstruction,
//    PublicKey,
//    TransactionSignature
//} from "@solana/web3.js";
//import { PDA, getTokenProgramAndDecimals, uiAmountToAmount } from "../utils";
//import { WasabiSolana } from "../../idl/wasabi_solana";
//import { getAssociatedTokenAddressSync } from "@solana/spl-token";
//import { BaseMethodConfig, AmountArgs, MintAccounts } from "../base";
//
//export const donateConfig: BaseMethodConfig<AmountArgs, MintAccounts> = {
//    processArgs: (args) => new BN(args.amount),
//    processAccounts: async (program, accounts) => {
//        const tokenProgram = await getTokenProgram(program, accounts.mint);
//        const lpVault = PDA.getLpVault(accounts.mint);
//        const ownerAssetAccount = getAssociatedTokenAddressSync(
//            accounts.mint,
//            program.provider.publicKey,
//        );
//
//        return {
//            owner: program.provider.publicKey,
//            ownerAssetAccount,
//            lpVault,
//            mint: accounts.mint,
//            tokenProgram,
//        };
//    },
//    getMethod: (program) => program.methods.donate
//};
//
//
//type DonateInstructionAccounts = {
//    owner: PublicKey,
//    ownerAssetAccount: PublicKey,
//    lpVault: PublicKey,
//    vault: PublicKey,
//    currency: PublicKey,
//    tokenProgram: PublicKey,
//}
//
//export async function getDonateInstructionAccounts(
//    program: Program<WasabiSolana>,
//    currency: PublicKey,
//    currencyTokenProgram: PublicKey,
//): Promise<DonateInstructionAccounts> {
//    const ownerAssetAccount = getAssociatedTokenAddressSync(
//        currency,
//        program.provider.publicKey,
//        false,
//        currencyTokenProgram,
//    );
//    const lpVault = PDA.getLpVault(currency);
//    const vault = getAssociatedTokenAddressSync(
//        currency,
//        lpVault,
//        true,
//        currencyTokenProgram,
//    );
//
//    return {
//        owner: program.provider.publicKey,
//        ownerAssetAccount,
//        lpVault,
//        vault,
//        currency,
//        tokenProgram: currencyTokenProgram,
//    }
//}
//
//export async function createDonateInstruction(
//    program: Program<WasabiSolana>,
//    args: DonateArgs,
//    accounts: DonateAccounts,
//    strict: boolean = true,
//): Promise<TransactionInstruction> {
//    const [tokenProgram, mintDecimals] = await getTokenProgramAndDecimals(program.provider.connection, accounts.currency);
//
//    const amount = uiAmountToAmount(args.amount, mintDecimals);
//    const donateAccounts = await getDonateInstructionAccounts(
//        program,
//        accounts.currency,
//        tokenProgram
//    );
//
//    const methodCall = program.methods.donate(amount);
//
//    if (strict) {
//        return methodCall.accountsStrict(donateAccounts).instruction();
//    } else {
//        const {
//            owner,
//            lpVault,
//            currency,
//            tokenProgram,
//        } = donateAccounts;
//
//        return methodCall.accounts({
//            owner,
//            lpVault,
//            currency,
//            tokenProgram,
//        }).instruction();
//    }
//}
//
//export async function donate(
//    program: Program<WasabiSolana>,
//    args: DonateArgs,
//    accounts: DonateAccounts,
//    strict: boolean = true,
//): Promise<TransactionSignature> {
//    const [tokenProgram, mintDecimals] = await getTokenProgramAndDecimals(program.provider.connection, accounts.currency);
//
//    const amount = uiAmountToAmount(args.amount, mintDecimals);
//    const donateAccounts = await getDonateInstructionAccounts(
//        program,
//        accounts.currency,
//        tokenProgram
//    );
//
//    const methodCall = program.methods.donate(amount);
//
//    if (strict) {
//        return methodCall.accountsStrict(donateAccounts).rpc();
//    } else {
//        const {
//            owner,
//            lpVault,
//            currency,
//            tokenProgram,
//        } = donateAccounts;
//
//        return methodCall.accounts({
//            owner,
//            lpVault,
//            currency,
//            tokenProgram,
//        }).rpc();
//    }
//}
