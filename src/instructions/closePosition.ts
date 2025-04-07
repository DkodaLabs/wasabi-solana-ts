import { Program, BN } from '@coral-xyz/anchor';
import {
    PublicKey,
    Connection,
    SystemProgram,
    TransactionInstruction,
    SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    PDA,
    getPermission,
    createAtaIfNeeded,
    handleMintsAndTokenProgram,
    handlePaymentTokenMintWithAuthority
} from '../utils';
import { createCloseStopLossOrderInstruction } from './closeStopLossOrder';
import { createCloseTakeProfitOrderInstruction } from './closeTakeProfitOrder';
import { WasabiSolana } from '../idl/wasabi_solana';
import { MintCache } from '../utils/mintCache';

export type CloseType = 'MARKET' | 'LIQUIDATION' | 'TAKE_PROFIT' | 'STOP_LOSS';

export type ExitOrderSetupInstructionAccounts = {
    closePositionSetup: ClosePositionSetupInstructionAccounts;
};

export type ExitOrderSetupInstructionAccountsStrict = {
    closePositionSetup: ClosePositionSetupInstructionAccountsStrict;
};

export type ClosePositionParams = {
    position: PublicKey;
    feeWallet: PublicKey;
} & ClosePositionSetupArgs;

export type ClosePositionSetupArgs = {
    /// The amount of the position to close
    amount: number; //u64
    /// The minimum amount out required when swapping
    minTargetAmount: number; // u64
    /// The amount of interest the user must pay
    interest: number; // u64
    /// The amount of the execution fee to be paid
    executionFee: number; // u64
    /// The unixtimestamp when this close position request expires
    expiration: number; // i64
};

export type ClosePositionSetupAccounts = {
    authority: PublicKey; // provided by ux
    position: PublicKey; // required
    pool: PublicKey; // derived via request + position
    collateral: PublicKey; // derived
    currency: PublicKey; // derived
};

export type ClosePositionSetupInstructionAccounts = {
    owner: PublicKey; // derived
    position: PublicKey; // required
    pool: PublicKey; // required
    collateral: PublicKey; // derived
    permission: PublicKey; // derived
    tokenProgram: PublicKey; // derived
};

export type ClosePositionSetupInstructionAccountsStrict = {
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    authority: PublicKey;
    closePositionRequest: PublicKey;
    systemProgram: PublicKey;
    sysvarInfo: PublicKey;
} & ClosePositionSetupInstructionAccounts;

export type ClosePositionCleanupAccounts = {
    authority: PublicKey; // derived
    position: PublicKey; // requires passing
    pool: PublicKey; // derived
    collateral: PublicKey; // derived
    currency: PublicKey; // derived
    feeWallet: PublicKey; // requires passing
    liquidationWallet: PublicKey; // requires passing
};

export type ClosePositionCleanupInstructionAccounts = {
    owner: PublicKey;
    authority: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    position: PublicKey;
    feeWallet: PublicKey;
    liquidationWallet: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
};

export type ClosePositionCleanupInstructionAccountsStrict = {
    ownerPayoutAccount: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    closePositionRequest: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    feeWalletCurrencyAccount: PublicKey;
    feeWalletCollateralAccount: PublicKey;
    liquidationWalletCurrencyAccount: PublicKey;
    liquidationWalletCollateralAccount: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
} & ClosePositionCleanupInstructionAccounts;

type CpsuAndIx = {
    accounts: ClosePositionSetupInstructionAccountsStrict;
    ixes: {
        setupIx?: TransactionInstruction[];
        cleanupIx?: TransactionInstruction[];
    };
};

type CpcuAndIx = {
    accounts: ClosePositionCleanupInstructionAccountsStrict;
    ixes: {
        setupIx?: TransactionInstruction[];
        cleanupIx?: TransactionInstruction[];
    };
};

export function transformArgs(args: ClosePositionSetupArgs): {
    minTargetAmount: BN;
    interest: BN;
    executionFee: BN;
    expiration: BN;
} {
    return {
        minTargetAmount: new BN(args.minTargetAmount),
        interest: new BN(args.interest),
        executionFee: new BN(args.executionFee),
        expiration: new BN(args.expiration)
    };
}

export async function getClosePositionSetupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionSetupAccounts,
    closeType?: CloseType,
    mintCache?: MintCache
): Promise<CpsuAndIx> {
    const [
        { currencyMint, collateralMint, currencyTokenProgram, collateralTokenProgram },
        owner,
        orderIx
    ] = await Promise.all([
        handleMintsAndTokenProgram(
            program.provider.connection,
            accounts.currency,
            accounts.collateral,
            { mintCache }
        ),
        program.account.position.fetch(accounts.position).then((pos) => pos.trader),
        handleOrdersCheck(program, accounts.position, closeType)
    ]);

    return {
        accounts: {
            owner,
            position: accounts.position,
            pool: accounts.pool,
            collateralVault: getAssociatedTokenAddressSync(
                collateralMint,
                accounts.pool,
                true,
                collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                currencyMint,
                accounts.pool,
                true,
                currencyTokenProgram
            ),
            collateral: collateralMint,
            authority: accounts.authority,
            permission: await getPermission(program, accounts.authority),
            closePositionRequest: PDA.getClosePositionRequest(owner),
            tokenProgram: collateralTokenProgram,
            systemProgram: SystemProgram.programId,
            sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
        },
        ixes: {
            setupIx: [...orderIx]
        }
    };
}

type TokenSetupResult = {
    currencyMint: PublicKey;
    collateralMint: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    ownerPayoutAccount: PublicKey;
    setupIx: any[];
    cleanupIx: any[];
};

async function fetchPositionData(
    program: Program<WasabiSolana>,
    positionAddress: PublicKey
): Promise<{ owner: PublicKey; lpVault: PublicKey }> {
    const position = await program.account.position.fetch(positionAddress);
    return { owner: position.trader, lpVault: position.lpVault };
}

async function fetchVaultAddress(
    program: Program<WasabiSolana>,
    lpVault: PublicKey
): Promise<PublicKey> {
    const lpVaultData = await program.account.lpVault.fetch(lpVault);
    return lpVaultData.vault;
}

// Close order when exiting positions if they exist
async function handleOrdersCheck(
    program: Program<WasabiSolana>,
    positionAddress: PublicKey,
    closeType?: CloseType
): Promise<TransactionInstruction[]> {
    const shouldCheckStopLoss =
        closeType === 'MARKET' || closeType === 'LIQUIDATION' || closeType === 'TAKE_PROFIT';
    const shouldCheckTakeProfit =
        closeType === 'MARKET' || closeType === 'LIQUIDATION' || closeType === 'STOP_LOSS';

    const [stopLoss, takeProfit] = await Promise.all([
        shouldCheckStopLoss
            ? program.account.stopLossOrder
                  .fetch(PDA.getStopLossOrder(positionAddress))
                  .catch(() => null)
            : null,
        shouldCheckTakeProfit
            ? program.account.takeProfitOrder
                  .fetch(PDA.getTakeProfitOrder(positionAddress))
                  .catch(() => null)
            : null
    ]);

    const ixes = [];

    if (stopLoss) {
        ixes.push(
            ...(await createCloseStopLossOrderInstruction(program, { position: positionAddress }))
        );
    }

    if (takeProfit) {
        ixes.push(
            ...(await createCloseTakeProfitOrderInstruction(program, { position: positionAddress }))
        );
    }

    return ixes;
}

async function handleAtaCheck(
    connection: Connection,
    owner: PublicKey,
    asset: PublicKey,
    tokenProgram: PublicKey,
    payer: PublicKey
): Promise<{
    ata: PublicKey;
    ix: TransactionInstruction;
}> {
    const ata = getAssociatedTokenAddressSync(asset, owner, true, tokenProgram);
    return {
        ata,
        ix: await createAtaIfNeeded(connection, owner, asset, ata, tokenProgram, payer)
    };
}

async function setupTokenAccounts(
    connection: Connection,
    owner: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    payer: PublicKey,
    isLong: boolean,
    isTriggeredByAuthority: boolean = false
): Promise<TokenSetupResult> {
    const {
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
        setupIx,
        cleanupIx
    } = await handlePaymentTokenMintWithAuthority(
        connection,
        isTriggeredByAuthority ? payer : owner,
        owner,
        isLong ? currency : collateral, // payment token mint
        currency,
        collateral,
        'unwrap'
    );

    const { ata, ix } = await handleAtaCheck(
        connection,
        owner,
        isLong ? currencyMint : collateralMint,
        isLong ? currencyTokenProgram : collateralTokenProgram,
        payer
    );

    if (ix) setupIx.push(ix);

    return {
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
        ownerPayoutAccount: ata,
        setupIx,
        cleanupIx
    };
}

export async function getClosePositionCleanupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
    isTriggeredByAuthority: boolean = false
): Promise<CpcuAndIx> {
    const { owner, lpVault } = await fetchPositionData(program, accounts.position);

    const [vault, tokenSetup] = await Promise.all([
        fetchVaultAddress(program, lpVault),
        setupTokenAccounts(
            program.provider.connection,
            owner,
            accounts.currency,
            accounts.collateral,
            program.provider.publicKey,
            await program.account.basePool.fetch(accounts.pool).then((pool) => pool.isLongPool),
            isTriggeredByAuthority
        )
    ]);

    return {
        accounts: {
            owner,
            ownerPayoutAccount: tokenSetup.ownerPayoutAccount,
            pool: accounts.pool,
            collateralVault: getAssociatedTokenAddressSync(
                tokenSetup.collateralMint,
                accounts.pool,
                true,
                tokenSetup.collateralTokenProgram
            ),
            currencyVault: getAssociatedTokenAddressSync(
                tokenSetup.currencyMint,
                accounts.pool,
                true,
                tokenSetup.currencyTokenProgram
            ),
            currency: tokenSetup.currencyMint,
            collateral: tokenSetup.collateralMint,
            closePositionRequest: PDA.getClosePositionRequest(owner),
            position: accounts.position,
            authority: accounts.authority,
            lpVault,
            vault,
            feeWallet: accounts.feeWallet,
            feeWalletCurrencyAccount: getAssociatedTokenAddressSync(
                tokenSetup.currencyMint,
                accounts.feeWallet,
                true,
                tokenSetup.currencyTokenProgram
            ),
            feeWalletCollateralAccount: getAssociatedTokenAddressSync(
                tokenSetup.collateralMint,
                accounts.feeWallet,
                true,
                tokenSetup.collateralTokenProgram
            ),
            liquidationWallet: accounts.liquidationWallet,
            liquidationWalletCurrencyAccount: getAssociatedTokenAddressSync(
                tokenSetup.currencyMint,
                accounts.liquidationWallet,
                true,
                tokenSetup.collateralTokenProgram
            ),
            liquidationWalletCollateralAccount: getAssociatedTokenAddressSync(
                tokenSetup.collateralMint,
                accounts.liquidationWallet,
                true,
                tokenSetup.collateralTokenProgram
            ),
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            currencyTokenProgram: tokenSetup.currencyTokenProgram,
            collateralTokenProgram: tokenSetup.collateralTokenProgram
        },
        ixes: {
            setupIx: tokenSetup.setupIx,
            cleanupIx: tokenSetup.cleanupIx
        }
    };
}
