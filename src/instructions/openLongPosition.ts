import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    PDA,
    handleMintsAndTokenProgram,
    handleMintsAndTokenProgramWithSetupAndCleanup,
    getPermission
} from '../utils';
import {
    BaseMethodConfig,
    ConfigArgs,
    Level,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import {
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts,
    OpenPositionSetupInstructionBaseAccounts
} from './openPosition';
import { WasabiSolana } from '../idl/wasabi_solana';

type OpenLongPositionSetupInstructionAccounts = {
    tokenProgram: PublicKey;
    debtController: PublicKey;
} & OpenPositionSetupInstructionBaseAccounts;

const openLongPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenLongPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>) => {
        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx
        } = await handleMintsAndTokenProgramWithSetupAndCleanup(
            config.program.provider.connection,
            config.accounts.owner,
            config.accounts.currency,
            config.accounts.collateral,
            'wrap',
            config.args.downPayment
        );
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getLongPool(collateralMint, currencyMint);

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.owner,
                    false,
                    currencyTokenProgram
                ),
                ownerCollateralAccount: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.owner,
                    false,
                    collateralTokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    currencyMint,
                    lpVault,
                    true,
                    currencyTokenProgram
                ),
                pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    pool,
                    true,
                    currencyTokenProgram
                ),
                currency: currencyMint,
                collateral: collateralMint,
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position: PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce),
                authority: config.program.provider.publicKey,
                permission: await getPermission(config.program, config.program.provider.publicKey),
                feeWallet: config.accounts.feeWallet,
                feeWalletAta: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.feeWallet,
                    true,
                    currencyTokenProgram
                ),
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                tokenProgram: currencyTokenProgram,
                systemProgram: SystemProgram.programId,
                sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
            },
            args: {
                nonce: config.args.nonce,
                minTargetAmount: new BN(config.args.minTargetAmount),
                downPayment: new BN(config.args.downPayment),
                principal: new BN(config.args.principal),
                fee: new BN(config.args.fee),
                expiration: new BN(config.args.expiration)
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.openLongPositionSetup(
            args.nonce,
            args.minTargetAmount,
            args.downPayment,
            args.principal,
            args.fee,
            args.expiration
        )
};

const openLongPositionCleanupConfig: BaseMethodConfig<
    void,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts
> = {
    process: async (config: ConfigArgs<void, OpenPositionCleanupAccounts>) => {
        const { currencyMint, collateralMint, currencyTokenProgram, collateralTokenProgram } =
            await handleMintsAndTokenProgram(
                config.program.provider.connection,
                config.accounts.currency,
                config.accounts.collateral
            );

        return {
            accounts: {
                owner: config.accounts.owner,
                pool: config.accounts.pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.pool,
                    true,
                    currencyTokenProgram
                ),
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position: config.accounts.position,
                tokenProgram: currencyTokenProgram
            }
        };
    },
    getMethod: (program) => () => program.methods.openLongPositionCleanup()
};

export async function createOpenLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionSetupArgs,
    accounts: OpenPositionSetupAccounts,
    feeLevel: Level = 'NORMAL'
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            openLongPositionSetupConfig,
            'INSTRUCTION',
            {
                level: feeLevel,
                ixType: 'TRADE'
            },
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createOpenLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(program, accounts, openLongPositionCleanupConfig, 'INSTRUCTION')
    ) as Promise<TransactionInstruction[]>;
}
