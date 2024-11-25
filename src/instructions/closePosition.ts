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
    handleMintsAndTokenProgramWithSetupAndCleanup,
} from '../utils';
import { createCloseStopLossOrderInstruction } from './closeStopLossOrder';
import { createCloseTakeProfitOrderInstruction } from './closeTakeProfitOrder';
import { WasabiSolana } from '../idl/wasabi_solana';

export enum CloseType {
    MARKET,
    LIQUIDATION,
    TAKE_PROFIT,
    STOP_LOSS,
}

export type ClosePositionParams = {
    position: PublicKey,
    feeWallet: PublicKey,
} & ClosePositionSetupArgs;

export type ExitOrderSetupInstructionAccounts = {
    closePositionSetup: ClosePositionSetupInstructionAccounts,
}

export type ExitOrderSetupInstructionAccountsStrict = {
    closePositionSetup: ClosePositionSetupInstructionAccountsStrict,
}

export type ClosePositionSetupArgs = {
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

type CpsAndIx = {
    accounts: ClosePositionSetupInstructionAccountsStrict,
    ixes: {
        setup?: TransactionInstruction[],
        cleanup?: TransactionInstruction[],
    }
}

export type ClosePositionCleanupAccounts = {
    authority: PublicKey; // derived
    position: PublicKey; // requires passing
    pool: PublicKey; // derived
    collateral: PublicKey; // derived
    currency: PublicKey; // derived
    feeWallet: PublicKey; // requires passing
};

export type ClosePositionCleanupInstructionAccounts = {
    owner: PublicKey;
    authority: PublicKey;
    collateral: PublicKey;
    currency: PublicKey;
    position: PublicKey;
    feeWallet: PublicKey;
    collateralTokenProgram: PublicKey;
    currencyTokenProgram: PublicKey;
};

export type ClosePositionCleanupInstructionAccountsStrict = {
    ownerCollateralAccount: PublicKey;
    ownerCurrencyAccount: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    currencyVault: PublicKey;
    closePositionRequest: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
} & ClosePositionCleanupInstructionAccounts;

type CpcuAndIx = {
    accounts: ClosePositionCleanupInstructionAccountsStrict,
    ixes: {
        setupIx?: TransactionInstruction[],
        cleanupIx?: TransactionInstruction[],
    }
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

// Close order when exiting positions if they exist
async function handleOrdersCheck(
    program: Program<WasabiSolana>,
    positionAddress: PublicKey,
    closeType?: CloseType
): Promise<TransactionInstruction[]> {
    // TODO: Implement cancelling of orders
    // const shouldCheckStopLoss = closeType === CloseType.MARKET
    //     || closeType === CloseType.LIQUIDATION
    //     || closeType === CloseType.TAKE_PROFIT;
    // const shouldCheckTakeProfit = closeType === CloseType.MARKET
    //     || closeType === CloseType.LIQUIDATION
    //     || closeType === CloseType.STOP_LOSS;
    //
    // const [stopLoss, takeProfit] = await Promise.all([
    //     shouldCheckStopLoss ? program.account.stopLossOrder.fetch(PDA.getStopLossOrder(positionAddress))
    //         .catch(() => null) : null,
    //     shouldCheckTakeProfit ? program.account.takeProfitOrder.fetch(PDA.getTakeProfitOrder(positionAddress))
    //         .catch(() => null) : null,
    // ]);
    //
    // const ixes = [];
    //
    // if (stopLoss) {
    //     ixes.push(
    //         ...(await createCloseStopLossOrderInstruction(program, { position: positionAddress }))
    //     );
    // }
    //
    // if (takeProfit) {
    //     ixes.push(
    //         ...(await createCloseTakeProfitOrderInstruction(program, { position: positionAddress }))
    //     );
    // }
    //
    // return ixes;

    return [];
}

export async function getClosePositionSetupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionSetupAccounts,
    closeType: CloseType,
): Promise<CpsAndIx> {
    const [{
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
    }, owner, ixes] = await Promise.all(
        [
            handleMintsAndTokenProgram(
                program.provider.connection,
                accounts.currency,
                accounts.collateral,
            ),
            program.account.position.fetch(accounts.position).then((pos) => pos.trader),
            handleOrdersCheck(program, accounts.position, closeType),
        ]
    );

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
            setup: ixes,
        }
    };
}

type TokenSetupResult = {
    currencyMint: PublicKey;
    collateralMint: PublicKey;
    currencyTokenProgram: PublicKey;
    collateralTokenProgram: PublicKey;
    ownerCurrencyAta: PublicKey;
    ownerCollateralAta: PublicKey;
    setupIx: any[];
    cleanupIx: any[];
}

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

async function setupTokenAccounts(
    connection: Connection,
    owner: PublicKey,
    currency: PublicKey,
    collateral: PublicKey,
    payer: PublicKey
): Promise<TokenSetupResult> {
    const {
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
        setupIx,
        cleanupIx,
    } = await handleMintsAndTokenProgramWithSetupAndCleanup(
        connection,
        owner,
        currency,
        collateral,
        'unwrap'
    );

    const ownerCurrencyAta = getAssociatedTokenAddressSync(currencyMint, owner, false, currencyTokenProgram);
    const ownerCollateralAta = getAssociatedTokenAddressSync(collateralMint, owner, false, collateralTokenProgram);

    const [currencyAtaIx, collateralAtaIx] = await Promise.all([
        createAtaIfNeeded(connection, owner, currencyMint, ownerCurrencyAta, currencyTokenProgram, payer),
        createAtaIfNeeded(connection, owner, collateralMint, ownerCollateralAta, collateralTokenProgram, payer)
    ]);

    if (currencyAtaIx) setupIx.push(currencyAtaIx);
    if (collateralAtaIx) setupIx.push(collateralAtaIx);

    return {
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
        ownerCurrencyAta,
        ownerCollateralAta,
        setupIx,
        cleanupIx,
    };
}

export async function getClosePositionCleanupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts,
): Promise<CpcuAndIx> {
    const { owner, lpVault } = await fetchPositionData(program, accounts.position);

    const [
        vault,
        tokenSetup
    ] = await Promise.all([
        fetchVaultAddress(program, lpVault),
        setupTokenAccounts(
            program.provider.connection,
            owner,
            accounts.currency,
            accounts.collateral,
            program.provider.publicKey
        ),
    ]);

    return {
        accounts: {
            owner,
            ownerCollateralAccount: tokenSetup.ownerCollateralAta,
            ownerCurrencyAccount: tokenSetup.ownerCurrencyAta,
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
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            currencyTokenProgram: tokenSetup.currencyTokenProgram,
            collateralTokenProgram: tokenSetup.collateralTokenProgram
        },
        ixes: {
            setupIx: tokenSetup.setupIx,
            cleanupIx: tokenSetup.cleanupIx,
        }
    };
}
