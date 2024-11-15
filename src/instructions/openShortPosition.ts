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
import { PDA, getPermission } from '../utils';
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
        const [collateralTokenProgram, currencyTokenProgram] =
            await config.program.provider.connection
                .getMultipleAccountsInfo([config.accounts.collateral, config.accounts.currency])
                .then((acc) => [acc[0].owner, acc[1].owner]);
        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getShortPool(config.accounts.collateral, config.accounts.currency);

        const allAccounts = {
            owner: config.accounts.owner,
            ownerCurrencyAccount: getAssociatedTokenAddressSync(
                config.accounts.currency,
                config.accounts.owner,
                false,
                currencyTokenProgram
            ),
            ownerTargetCurrencyAccount: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                config.accounts.owner,
                false,
                collateralTokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                lpVault,
                true,
                collateralTokenProgram
            ),
            pool,
            collateralVault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                pool,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                pool,
                true,
                currencyTokenProgram
            ),
            currency: config.accounts.currency,
            collateral: config.accounts.collateral,
            openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
            position: PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce),
            authority: config.program.provider.publicKey,
            permission: await getPermission(config.program, config.program.provider.publicKey),
            feeWallet: config.accounts.feeWallet,
            globalSettings: PDA.getGlobalSettings(),
            currencyTokenProgram,
            collateralTokenProgram,
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
            args
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
        const [collateralTokenProgram, currencyTokenProgram] =
            await config.program.provider.connection
                .getMultipleAccountsInfo([config.accounts.collateral, config.accounts.currency])
                .then((acc) => [acc[0].owner, acc[1].owner]);
        const lpVault = PDA.getLpVault(config.accounts.currency);
        const allAccounts = {
            owner: config.accounts.owner,
            position: config.accounts.position,
            pool: config.accounts.pool,
            collateralVault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                config.accounts.pool,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                config.accounts.pool,
                true,
                currencyTokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                lpVault,
                true,
                currencyTokenProgram,
            ),
            collateral: config.accounts.collateral,
            currency: config.accounts.currency,
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
