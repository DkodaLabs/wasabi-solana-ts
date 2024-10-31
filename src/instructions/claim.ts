import { Program } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { BaseMethodConfig, handleMethodCall } from "../base";
import { getTokenProgram, PDA } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export interface ClaimPositionAccounts {
    currency: PublicKey;
    collateral: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    feeWallet: PublicKey;
}

interface ClaimPositionInstructionAccounts {
    trader: PublicKey,
    traderCurrencyAccount: PublicKey,
    traderCollateralAccount: PublicKey,
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey,
    currency: PublicKey;
    collateral: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    feeWallet: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
}

export const claimPositionConfig: BaseMethodConfig<void, ClaimPositionAccounts, ClaimPositionInstructionAccounts> = {
    process: async (program, accounts) => {
        const [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
            getTokenProgram(program, accounts.collateral),
            getTokenProgram(program, accounts.currency),
        ]);
        const traderCurrencyAccount = getAssociatedTokenAddressSync(
            accounts.currency,
            program.provider.publicKey,
            false,
            currencyTokenProgram
        );
        const traderCollateralAccount = getAssociatedTokenAddressSync(
            accounts.collateral,
            program.provider.publicKey,
            false,
            collateralTokenProgram,
        );
        const poolInfo = await program.account.basePool.fetch(accounts.pool);
        const lpVault = (poolInfo.isLongPool)
            ? PDA.getLpVault(accounts.currency)
            : PDA.getLpVault(accounts.currency);
        const vault = getAssociatedTokenAddressSync(
            accounts.currency, 
            lpVault, 
            true, 
            currencyTokenProgram
        );
        const collateralVault = getAssociatedTokenAddressSync(
            accounts.collateral, 
            accounts.pool, 
            true, 
            collateralTokenProgram
        );

        return {
            accounts: {
                trader: program.provider.publicKey,
                traderCurrencyAccount,
                traderCollateralAccount,
                position: accounts.position,
                pool: accounts.pool,
                collateralVault,
                currency: accounts.currency,
                collateral: accounts.collateral,
                lpVault,
                vault,
                feeWallet: accounts.feeWallet,
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                collateralTokenProgram,
                currencyTokenProgram,
            }
        };
    },
    getMethod: (program) => () => program.methods.claimPosition()
};

export async function createClaimPositionInstruction(
    program: Program<WasabiSolana>,
    accounts: ClaimPositionAccounts,
    strict: boolean = true
): Promise<TransactionInstruction> {
    return handleMethodCall(
        program,
        accounts,
        claimPositionConfig,
        'instruction',
        undefined,
        strict
    ) as Promise<TransactionInstruction>;
}

export async function claimPosition(
    program: Program<WasabiSolana>,
    accounts: ClaimPositionAccounts,
    strict: boolean = true
): Promise<TransactionSignature> {
    return handleMethodCall(
        program,
        accounts,
        claimPositionConfig,
        'transaction',
        undefined,
        strict
    ) as Promise<TransactionSignature>;
}
