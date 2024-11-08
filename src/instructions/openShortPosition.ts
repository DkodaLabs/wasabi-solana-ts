import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { PDA, getPermission } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type OpenShortPositionSetupArgs = {
    /// The nonce of the position
    nonce: number; // u16
    /// The minimum amount out required when swapping
    minTargetAmount: number; // u64
    /// The initial down payment amount required to open the position
    // (is in `currency` for short positions, `collateralCurrency` for short
    // positions
    downPayment: number; // u64
    /// The total principal amount to be borrowed for the position.
    principal: number; // u64
    /// The fee to be paid for the position
    fee: number; // u64
    /// The timestamp when this position request expires as a unixtimestamp
    expiration: number; // i64
};

export type OpenShortPositionSetupAccounts = {
    owner: PublicKey;
    /// Backend authority - should always be `program.provider.publicKey` as the microservice constructs the instruction
    //authority: PublicKey,
    /// The address of the currency to be paid for the position.
    currency: PublicKey;
    collateral: PublicKey;
    feeWallet: PublicKey;
};

type OpenShortPositionSetupInstructionAccounts = {
    owner: PublicKey;
    lpVault: PublicKey;
    shortPool: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
};

type OpenShortPositionSetupInstructionAccountsStrict = {
    ownerCurrencyAccount: PublicKey;
    vault: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    position: PublicKey;
    globalSettings: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
} & OpenShortPositionSetupInstructionAccounts;

export type OpenShortPositionCleanupAccounts = {
    owner: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    shortPool: PublicKey;
    position: PublicKey;
};

type OpenShortPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    shortPool: PublicKey;
    position: PublicKey;
    tokenProgram: PublicKey;
};

type OpenShortPositionCleanupInstructionAccountsStrict = {
    vault: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    openPositionRequest: PublicKey;
    debtController: PublicKey;
} & OpenShortPositionCleanupInstructionAccounts;

const openShortPositionSetupConfig: BaseMethodConfig<
    OpenShortPositionSetupArgs,
    OpenShortPositionSetupAccounts,
    OpenShortPositionSetupInstructionAccounts | OpenShortPositionSetupInstructionAccountsStrict
> = {
    process: async (
        config: ConfigArgs<OpenShortPositionSetupArgs, OpenShortPositionSetupAccounts>
    ) => {
        const [collateralTokenProgram, currencyTokenProgram] =
            await config.program.provider.connection
                .getMultipleAccountsInfo([config.accounts.collateral, config.accounts.currency])
                .then((acc) => [acc[0].owner, acc[1].owner]);
        const lpVault = PDA.getLpVault(config.accounts.collateral);
        const shortPool = PDA.getShortPool(config.accounts.collateral, config.accounts.currency);

        const allAccounts = {
            owner: config.accounts.owner,
            ownerCurrencyAccount: getAssociatedTokenAddressSync(
                config.accounts.currency,
                config.accounts.owner,
                false,
                currencyTokenProgram
            ),
            ownerCollateralAccount: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                config.accounts.owner,
                false,
                collateralTokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                lpVault,
                true,
                collateralTokenProgram
            ),
            shortPool,
            collateralVault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                shortPool,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                shortPool,
                true,
                currencyTokenProgram
            ),
            currency: config.accounts.currency,
            collateral: config.accounts.collateral,
            openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
            position: PDA.getPosition(config.accounts.owner, shortPool, lpVault, config.args.nonce),
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
                      shortPool: allAccounts.shortPool,
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
    OpenShortPositionCleanupAccounts,
    OpenShortPositionCleanupInstructionAccounts | OpenShortPositionCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, OpenShortPositionCleanupAccounts>) => {
        const [collateralTokenProgram, currencyTokenProgram] =
            await config.program.provider.connection
                .getMultipleAccountsInfo([config.accounts.collateral, config.accounts.currency])
                .then((acc) => [acc[0].owner, acc[1].owner]);
        const lpVault = PDA.getLpVault(config.accounts.collateral);
        const allAccounts = {
            owner: config.accounts.owner,
            position: config.accounts.position,
            shortPool: config.accounts.shortPool,
            collateralVault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                config.accounts.shortPool,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                config.accounts.shortPool,
                true,
                currencyTokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                lpVault,
                true,
                collateralTokenProgram
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
                      shortPool: allAccounts.shortPool,
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
    args: OpenShortPositionSetupArgs,
    accounts: OpenShortPositionSetupAccounts,
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
    accounts: OpenShortPositionCleanupAccounts,
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
