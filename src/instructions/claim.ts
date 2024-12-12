import { Program } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import { getTokenProgram, PDA, isSOL, handleSOL } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type ClaimPositionAccounts = {
    currency: PublicKey;
    collateral: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    feeWallet: PublicKey;
};

type ClaimPositionInstructionAccounts = {
    trader: PublicKey;
    traderCurrencyAccount: PublicKey;
    traderCollateralAccount: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    feeWallet: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
};

export const claimPositionConfig: BaseMethodConfig<
    void,
    ClaimPositionAccounts,
    ClaimPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, ClaimPositionAccounts>) => {
        const setup: TransactionInstruction[] = [];
        const cleanup: TransactionInstruction[] = [];
        const isCurrencySOL = isSOL(config.accounts.currency);
        const isCollateralSOL = isSOL(config.accounts.collateral);
        let currencyTokenProgram: PublicKey;
        let collateralTokenProgram: PublicKey;
        let currencyMint: PublicKey = config.accounts.currency;
        let collateralMint: PublicKey = config.accounts.collateral;

        // TODO: We need to actually calculate the transfer amounts in the program
        // to create the wrapped tokens...
        if (isCurrencySOL) {
            let { tokenProgram, nativeMint } = handleSOL();
            currencyTokenProgram = tokenProgram;
            currencyMint = nativeMint;
        }
        if (isCollateralSOL) {
            let { tokenProgram, nativeMint } = handleSOL();
            collateralTokenProgram = tokenProgram;
            collateralMint = nativeMint;
        }

        if (!isCurrencySOL && !isCollateralSOL) {
            [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
                getTokenProgram(config.program.provider.connection, config.accounts.collateral),
                getTokenProgram(config.program.provider.connection, config.accounts.currency)
            ]);
        } else {
            if (!isCurrencySOL) {
                currencyTokenProgram = await getTokenProgram(
                    config.program.provider.connection,
                    config.accounts.currency
                );
            }
            if (!isCollateralSOL) {
                collateralTokenProgram = await getTokenProgram(
                    config.program.provider.connection,
                    config.accounts.collateral
                );
            }
        }

        const traderCurrencyAccount = getAssociatedTokenAddressSync(
            currencyMint,
            config.program.provider.publicKey,
            false,
            currencyTokenProgram
        );
        const traderCollateralAccount = getAssociatedTokenAddressSync(
            collateralMint,
            config.program.provider.publicKey,
            false,
            collateralTokenProgram
        );
        const poolInfo = await config.program.account.basePool.fetch(config.accounts.pool);
        const lpVault = poolInfo.isLongPool
            ? PDA.getLpVault(currencyMint)
            : PDA.getLpVault(currencyMint);
        const vault = getAssociatedTokenAddressSync(
            currencyMint,
            lpVault,
            true,
            currencyTokenProgram
        );
        const collateralVault = getAssociatedTokenAddressSync(
            collateralMint,
            config.accounts.pool,
            true,
            collateralTokenProgram
        );

        const accounts = {
            trader: config.program.provider.publicKey,
            traderCurrencyAccount,
            traderCollateralAccount,
            position: config.accounts.position,
            pool: config.accounts.pool,
            collateralVault,
            currency: currencyMint,
            collateral: collateralMint,
            lpVault,
            vault,
            feeWallet: config.accounts.feeWallet,
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            collateralTokenProgram,
            currencyTokenProgram
        };

        return {
            accounts
        };
    },
    getMethod: (program) => () => program.methods.claimPosition()
};

export async function createClaimPositionInstruction(
    program: Program<WasabiSolana>,
    accounts: ClaimPositionAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: claimPositionConfig,
      }) as Promise<TransactionInstruction[]>;
}
