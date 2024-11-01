import { Program } from "@coral-xyz/anchor";
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey
} from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from "../base";
import { getTokenProgram, PDA } from "../utils";
import { WasabiSolana } from "../../idl/wasabi_solana";

export type ClaimPositionAccounts = {
    currency: PublicKey;
    collateral: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    feeWallet: PublicKey;
}

type ClaimPositionInstructionAccounts = {
    position: PublicKey,
    pool: PublicKey,
    collateral: PublicKey,
    currency: PublicKey,
    feeWallet: PublicKey,
    collateralTokenProgram: PublicKey,
    currencyTokenProgram: PublicKey,
}

type ClaimPositionInstructionAccountsStrict = {
    trader: PublicKey,
    traderCurrencyAccount: PublicKey,
    traderCollateralAccount: PublicKey,
    collateralVault: PublicKey,
    lpVault: PublicKey,
    vault: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
} & ClaimPositionInstructionAccounts;

export const claimPositionConfig: BaseMethodConfig<
    void,
    ClaimPositionAccounts,
    ClaimPositionInstructionAccounts | ClaimPositionInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, ClaimPositionAccounts>) => {
        const [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
            getTokenProgram(config.program.provider.connection, config.accounts.collateral),
            getTokenProgram(config.program.provider.connection, config.accounts.currency),
        ]);
        const traderCurrencyAccount = getAssociatedTokenAddressSync(
            config.accounts.currency,
            config.program.provider.publicKey,
            false,
            currencyTokenProgram
        );
        const traderCollateralAccount = getAssociatedTokenAddressSync(
            config.accounts.collateral,
            config.program.provider.publicKey,
            false,
            collateralTokenProgram,
        );
        const poolInfo = await config.program.account.basePool.fetch(config.accounts.pool);
        const lpVault = (poolInfo.isLongPool)
            ? PDA.getLpVault(config.accounts.currency)
            : PDA.getLpVault(config.accounts.currency);
        const vault = getAssociatedTokenAddressSync(
            config.accounts.currency,
            lpVault,
            true,
            currencyTokenProgram
        );
        const collateralVault = getAssociatedTokenAddressSync(
            config.accounts.collateral,
            config.accounts.pool,
            true,
            collateralTokenProgram
        );

        const allAccounts = {
            trader: config.program.provider.publicKey,
            traderCurrencyAccount,
            traderCollateralAccount,
            position: config.accounts.position,
            pool: config.accounts.pool,
            collateralVault,
            currency: config.accounts.currency,
            collateral: config.accounts.collateral,
            lpVault,
            vault,
            feeWallet: config.accounts.feeWallet,
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            collateralTokenProgram,
            currencyTokenProgram,
        };

        return {
            accounts: config.strict ? allAccounts : {
                position: allAccounts.position,
                pool: allAccounts.pool,
                collateral: allAccounts.collateral,
                currency: allAccounts.currency,
                feeWallet: allAccounts.feeWallet,
                collateralTokenProgram: allAccounts.collateralTokenProgram,
                currencyTokenProgram: allAccounts.currencyTokenProgram,
            }
        };
    },
    getMethod: (program) => () => program.methods.claimPosition()
};

export async function createClaimPositionInstruction(
    program: Program<WasabiSolana>,
    accounts: ClaimPositionAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            claimPositionConfig,
            'instruction',
            strict,
            increaseCompute,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function claimPosition(
    program: Program<WasabiSolana>,
    accounts: ClaimPositionAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            claimPositionConfig,
            'transaction',
            strict,
            increaseCompute,
        )
    ) as Promise<TransactionSignature>;
}
