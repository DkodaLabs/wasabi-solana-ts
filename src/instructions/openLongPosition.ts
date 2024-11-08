import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PDA, getPermission, getTokenProgram } from '../utils';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';

//TODO: This is probably going to need a lookup table due to the high number of accounts
//being used

export type OpenLongPositionSetupArgs = {
    /// The nonce of the position
    nonce: number; // u16
    /// The minimum amount out required when swapping
    minTargetAmount: number; // u64
    /// The initial down payment amount required to open the position
    // (is in `currency` for long positions, `collateralCurrency` for short
    // positions
    downPayment: number; // u64
    /// The total principal amount to be borrowed for the position.
    principal: number; // u64
    /// The fee to be paid for the position
    fee: number; // u64
    /// The timestamp when this position request expires as a unixtimestamp
    expiration: number; // i64
};

export type OpenLongPositionSetupAccounts = {
    /// Needs to be passed in as we construct the instruction for the user
    owner: PublicKey;
    /// Backend authority - this should be program.provider.publicKey since we always
    /// construct the instruction for the user
    //authority: PublicKey,
    /// The address of the currency to be paid for the position.
    /// QUOTE
    currency: PublicKey;
    /// BASE
    collateral: PublicKey;
    feeWallet: PublicKey;
};

type OpenLongPositionSetupInstructionAccounts = {
    owner: PublicKey;
    lpVault: PublicKey;
    longPool: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    tokenProgram: PublicKey;
};
type OpenLongPositionSetupInstructionAccountsStrict = {
    ownerCurrencyAccount: PublicKey;
    vault: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    position: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
} & OpenLongPositionSetupInstructionAccounts;

export type OpenLongPositionCleanupAccounts = {
    owner: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    longPool: PublicKey;
    position: PublicKey;
};

type OpenLongPositionCleanupInstructionAccounts = {
    owner: PublicKey;
    longPool: PublicKey;
    position: PublicKey;
    tokenProgram: PublicKey;
};

type OpenLongPositionCleanupInstructionAccountsStrict = {
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    openPositionRequest: PublicKey;
} & OpenLongPositionCleanupInstructionAccounts;

const openLongPositionSetupConfig: BaseMethodConfig<
    OpenLongPositionSetupArgs,
    OpenLongPositionSetupAccounts,
    OpenLongPositionSetupInstructionAccounts | OpenLongPositionSetupInstructionAccountsStrict
> = {
    process: async (
        config: ConfigArgs<OpenLongPositionSetupArgs, OpenLongPositionSetupAccounts>
    ) => {
        const [collateralTokenProgram, currencyTokenProgram] = await Promise.all([
            getTokenProgram(config.program.provider.connection, config.accounts.collateral),
            getTokenProgram(config.program.provider.connection, config.accounts.currency)
        ]);
        const lpVault = PDA.getLpVault(config.accounts.currency);
        const longPool = PDA.getLongPool(config.accounts.currency, config.accounts.collateral);
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
                config.accounts.currency,
                lpVault,
                true,
                currencyTokenProgram
            ),
            longPool,
            collateralVault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                lpVault,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                lpVault,
                true,
                currencyTokenProgram
            ),
            currency: config.accounts.currency,
            collateral: config.accounts.collateral,
            openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
            position: PDA.getPosition(config.accounts.owner, longPool, lpVault, config.args.nonce),
            authority: config.program.provider.publicKey,
            permission: await getPermission(config.program, config.program.provider.publicKey),
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
                      longPool: allAccounts.longPool,
                      collateral: allAccounts.collateral,
                      currency: allAccounts.currency,
                      authority: allAccounts.authority,
                      permission: allAccounts.permission,
                      feeWallet: allAccounts.feeWallet,
                      tokenProgram: allAccounts.tokenProgram
                  },
            args
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
    OpenLongPositionCleanupAccounts,
    OpenLongPositionCleanupInstructionAccounts | OpenLongPositionCleanupInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<void, OpenLongPositionCleanupAccounts>) => {
        const [collateralTokenProgram, currencyTokenProgram] =
            await config.program.provider.connection
                .getMultipleAccountsInfo([config.accounts.collateral, config.accounts.currency])
                .then((acc) => [acc[0].owner, acc[1].owner]);
        const allAccounts = {
            owner: config.accounts.owner,
            longPool: config.accounts.longPool,
            collateralVault: getAssociatedTokenAddressSync(
                config.accounts.collateral,
                config.accounts.longPool,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                config.accounts.currency,
                config.accounts.longPool,
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
                      longPool: allAccounts.longPool,
                      position: allAccounts.position,
                      tokenProgram: allAccounts.tokenProgram
                  }
        };
    },
    getMethod: (program) => () => program.methods.openLongPositionCleanup()
};

export async function createOpenLongPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenLongPositionSetupArgs,
    accounts: OpenLongPositionSetupAccounts,
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
    accounts: OpenLongPositionCleanupAccounts,
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
