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
} from '../utils';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import {
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts,
    OpenPositionSetupInstructionBaseAccounts,
    OpenPositionSetupInstructionBaseStrictAccounts,
    OpenPositionCleanupInstructionBaseStrictAccounts,
} from './openPosition';
import { WasabiSolana } from '../idl/wasabi_solana';

type OpenLongPositionSetupInstructionAccounts = {
    tokenProgram: PublicKey;
} & OpenPositionSetupInstructionBaseAccounts;

type OpenLongPositionSetupInstructionAccountsStrict = {
    debtController: PublicKey;
} & OpenLongPositionSetupInstructionAccounts & OpenPositionSetupInstructionBaseStrictAccounts;

type OpenLongPositionCleanupInstructionAccountsStrict = OpenPositionCleanupInstructionBaseStrictAccounts & OpenPositionCleanupInstructionAccounts;

const openLongPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenLongPositionSetupInstructionAccounts | OpenLongPositionSetupInstructionAccountsStrict
> = {
    process: async (
        config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>
    ) => {
        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx,
        } = await handleMintsAndTokenProgramWithSetupAndCleanup(
            config.program.provider.connection,
            config.accounts.owner,
            config.accounts.currency,
            config.accounts.collateral,
            'wrap',
            config.args.downPayment,
        );
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getLongPool(collateralMint, currencyMint);
        const allAccounts = {
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
            position: PDA.getPosition(
                config.accounts.owner,
                pool,
                lpVault,
                config.args.nonce
            ),
            authority: config.program.provider.publicKey,
            permission: PDA.getSuperAdmin(),//await getPermission(config.program, config.program.provider.publicKey),
            feeWallet: config.accounts.feeWallet,
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            tokenProgram: currencyTokenProgram,
            systemProgram: SystemProgram.programId,
            sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
        };

        const args = {
            nonce: config.args.nonce,
            minTargetAmount: new BN(config.args.minTargetAmount),
            downPayment: new BN(config.args.downPayment),
            principal: new BN(config.args.principal),
            fee: new BN(config.args.fee),
            expiration: new BN(config.args.expiration)
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: allAccounts.owner,
                    lpVault: allAccounts.lpVault,
                    pool: allAccounts.pool,
                    collateral: allAccounts.collateral,
                    currency: allAccounts.currency,
                    authority: allAccounts.authority,
                    permission: allAccounts.permission,
                    feeWallet: allAccounts.feeWallet,
                    tokenProgram: allAccounts.tokenProgram
                },
            args,
            setup: setupIx,
            cleanup: cleanupIx,
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
    OpenPositionCleanupInstructionAccounts | OpenLongPositionCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, OpenPositionCleanupAccounts>) => {
        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
        } = await handleMintsAndTokenProgram(
            config.program.provider.connection,
            config.accounts.currency,
            config.accounts.collateral,
        );

        const allAccounts = {
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
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: allAccounts.owner,
                    pool: allAccounts.pool,
                    position: allAccounts.position,
                    tokenProgram: allAccounts.tokenProgram
                }
        };
    },
    getMethod: (program) => () => program.methods.openLongPositionCleanup()
};

export async function createOpenLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionSetupArgs,
    accounts: OpenPositionSetupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            openLongPositionSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createOpenLongPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            openLongPositionCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}
