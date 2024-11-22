import { Program, BN } from '@coral-xyz/anchor';
import {
    PublicKey,
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
import { WasabiSolana } from '../idl/wasabi_solana';

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

export type ExitOrderCleanupInstructionAccounts = {
    closePositionCleanup: ClosePositionCleanupInstructionAccounts,
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

export async function getClosePositionSetupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionSetupAccounts
): Promise<ClosePositionSetupInstructionAccountsStrict> {
    const [{
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
    }, owner] = await Promise.all(
        [
            handleMintsAndTokenProgram(
                program.provider.connection,
                accounts.currency,
                accounts.collateral,
            ),
            program.account.position.fetch(accounts.position).then((pos) => pos.trader)
        ]
    );

    return {
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
    };
}

export async function getClosePositionCleanupInstructionAccounts(
    program: Program<WasabiSolana>,
    accounts: ClosePositionCleanupAccounts
): Promise<CpcuAndIx> {
    const [owner, lpVault] = await program
        .account
        .position
        .fetch(accounts.position).then((pos) => [pos.trader, pos.lpVault]);
    const [vault, {
        currencyMint,
        collateralMint,
        currencyTokenProgram,
        collateralTokenProgram,
        setupIx,
        cleanupIx,
    }] = await Promise.all([
        program.account.lpVault.fetch(lpVault).then((lpVault) => lpVault.vault),
        handleMintsAndTokenProgramWithSetupAndCleanup(
            program.provider.connection,
            owner,
            accounts.currency,
            accounts.collateral,
            'unwrap',
        ),
    ]);

    let ownerCurrencyAta = getAssociatedTokenAddressSync(currencyMint, owner, false, currencyTokenProgram);
    let ownerCollateralAta = getAssociatedTokenAddressSync(collateralMint, owner, false, collateralTokenProgram);

    const [currencyAtaIx, collateralAtaIx] = await Promise.all([
        createAtaIfNeeded(
            program.provider.connection,
            owner,
            currencyMint,
            ownerCurrencyAta,
            currencyTokenProgram,
            program.provider.publicKey,
        ),
        createAtaIfNeeded(
            program.provider.connection,
            owner,
            collateralMint,
            ownerCollateralAta,
            collateralTokenProgram,
            program.provider.publicKey
        )
    ]);

    if (currencyAtaIx) {
        setupIx.push(currencyAtaIx);
    }

    if (collateralAtaIx) {
        setupIx.push(collateralAtaIx);
    }

    return {
        accounts: {
            owner,
            ownerCollateralAccount: ownerCollateralAta,
            ownerCurrencyAccount: ownerCurrencyAta,
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
            currency: currencyMint,
            collateral: collateralMint,
            closePositionRequest: PDA.getClosePositionRequest(owner),
            position: accounts.position,
            authority: accounts.authority,
            lpVault,
            vault,
            feeWallet: accounts.feeWallet,
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            currencyTokenProgram,
            collateralTokenProgram
        },
        ixes: {
            setupIx,
            cleanupIx,
        }
    };
}
