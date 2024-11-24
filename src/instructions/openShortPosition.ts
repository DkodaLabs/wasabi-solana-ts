import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
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
import {
    PDA,
    getPermission,
    handleMint,
    handleMintsAndTokenProgram,
} from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

type OpenShortPositionSetupInstructionAccounts = {
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
} & OpenPositionSetupInstructionBaseAccounts;

type OpenShortPositionSetupInstructionAccountsStrict = OpenPositionSetupInstructionBaseStrictAccounts & OpenShortPositionSetupInstructionAccounts;

type OpenShortPositionCleanupInstructionAccountsStrict = {
    vault: PublicKey;
    debtController: PublicKey;
} & OpenPositionCleanupInstructionAccounts & OpenPositionCleanupInstructionBaseStrictAccounts;

const openShortPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenShortPositionSetupInstructionAccounts | OpenShortPositionSetupInstructionAccountsStrict
> = {
    process: async (
        config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>
    ) => {
        const [
            { mint: currencyMint, tokenProgram: currencyTokenProgram },
            {
                mint: collateralMint,
                tokenProgram: collateralTokenProgram,
                setupIx,
                cleanupIx
            }
        ] = await Promise.all([
            handleMint(config.program.provider.connection, config.accounts.currency),
            handleMint(
                config.program.provider.connection,
                config.accounts.collateral,
                config.program.provider.publicKey,
                'wrap',
                config.args.downPayment,
            )
        ]);
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getShortPool(collateralMint, currencyMint);

        const allAccounts = {
            owner: config.accounts.owner,
            ownerTargetCurrencyAccount: getAssociatedTokenAddressSync(
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
                currencyTokenProgram,
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
            globalSettings: PDA.getGlobalSettings(),
            currencyTokenProgram,
            collateralTokenProgram,
            systemProgram: SystemProgram.programId,
            sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY,
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
                    lpVault,
                    pool: allAccounts.pool,
                    currency: allAccounts.currency,
                    collateral: allAccounts.collateral,
                    permission: allAccounts.permission,
                    authority: allAccounts.authority,
                    feeWallet: allAccounts.feeWallet,
                    currencyTokenProgram,
                    collateralTokenProgram
                },
            args,
            setup: setupIx,
            cleanup: cleanupIx,
        };
    },
    getMethod: (program) => (args) =>
        program.methods.openShortPositionSetup(
            args.nonce,
            args.minTargetAmount,
            args.downPayment,
            args.principal,
            args.fee,
            args.expiration
        )
};

const openShortPositionCleanupConfig: BaseMethodConfig<
    void,
    OpenPositionCleanupAccounts,
    OpenPositionCleanupInstructionAccounts | OpenShortPositionCleanupInstructionAccountsStrict
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
        const lpVault = PDA.getLpVault(config.accounts.currency);
        const allAccounts = {
            owner: config.accounts.owner,
            position: config.accounts.position,
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
            lpVault,
            vault: getAssociatedTokenAddressSync(
                currencyMint,
                lpVault,
                true,
                currencyTokenProgram,
            ),
            collateral: collateralMint,
            currency: currencyMint,
            openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
            debtController: PDA.getDebtController(),
            tokenProgram: currencyTokenProgram
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: allAccounts.owner,
                    pool: allAccounts.pool,
                    lpVault,
                    collateral: allAccounts.collateral,
                    currency: allAccounts.currency,
                    position: allAccounts.position,
                    tokenProgram: allAccounts.tokenProgram
                }
        };
    },
    getMethod: (program) => () => program.methods.openShortPositionCleanup()
};

export async function createOpenShortPositionSetupInstruction(
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
            openShortPositionSetupConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function createOpenShortPositionCleanupInstruction(
    program: Program<WasabiSolana>,
    accounts: OpenPositionCleanupAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            openShortPositionCleanupConfig,
            'instruction',
            strict,
            increaseCompute
        )
    ) as Promise<TransactionInstruction[]>;
}
