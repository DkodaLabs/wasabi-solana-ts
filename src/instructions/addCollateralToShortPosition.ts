import { BN } from '@coral-xyz/anchor';
import { ConfigArgs } from '../base';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { handleOpenTokenAccounts, PDA } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { TokenInstructionAccounts } from './tokenAccounts';

export type AddCollateralArgs = {
    downPayment: bigint;
    fee: bigint;
    expiration: bigint;
};

export type AddCollateralAccounts = {
    owner: PublicKey;
    position: PublicKey;
    feeWallet: PublicKey;
};

export type AddCollateralInstructionAccounts = {
    owner: PublicKey;
    ownerTargetCurrencyAccount: PublicKey;
    position: PublicKey;
    pool: PublicKey;
    collateralVault: PublicKey;
    collateral: PublicKey;
    feeWallet: PublicKey;
    globalSettings: PublicKey;
    collateralTokenProgram: PublicKey;
};

export async function processAddCollateralInstruction(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    options: {
        useShares: boolean;
        methodName: string;
    }
): Promise<TransactionInstruction[]> {
    const { useShares } = options;

    const position = await config.program.account.position.fetchNullable(config.accounts.position);
    if (!position) throw new Error('Position not found');

    const pool = PDA.getShortPool(position.collateral, position.currency);

    if (!config.args) {
        throw new Error('Args are required');
    }

    const { ownerPaymentAta, setupIx, cleanupIx, collateralTokenProgram } =
        await handleOpenTokenAccounts({
            program: config.program,
            owner: config.accounts.owner,
            mintCache: config.mintCache,
            downPayment: config.args.downPayment,
            fee: config.args.fee,
            currency: position.currency,
            collateral: position.collateral,
            isLongPool: false,
            useShares
        });

    if (!ownerPaymentAta) {
        throw new Error('Owner payout account does not exist');
    }


    const addCollateralAccounts: AddCollateralInstructionAccounts = {
        owner: config.accounts.owner,
        ownerTargetCurrencyAccount: ownerPaymentAta,
        position: config.accounts.position,
        pool,
        collateralVault: position.collateralVault,
        collateral: position.collateral,
        feeWallet: config.accounts.feeWallet,
        globalSettings: PDA.getGlobalSettings(),
        collateralTokenProgram
    };

    const params = [
        new BN(config.args.downPayment),
        new BN(config.args.fee),
        new BN(config.args.expiration)
    ] as const;

    if (useShares) {
        const lpVault = PDA.getLpVault(position.collateral);
        const vault = getAssociatedTokenAddressSync(
            position.collateral,
            lpVault,
            true,
            collateralTokenProgram
        );
        const sharesMint = PDA.getSharesMint(lpVault, position.collateral);
        const globalSettings = PDA.getGlobalSettings();

        const withdrawAccounts: TokenInstructionAccounts = {
            owner: config.accounts.owner,
            ownerAssetAccount: ownerPaymentAta,
            ownerSharesAccount: getAssociatedTokenAddressSync(
                sharesMint,
                config.accounts.owner,
                false,
                TOKEN_2022_PROGRAM_ID
            ),
            lpVault,
            vault,
            assetMint: position.collateral,
            sharesMint,
            globalSettings,
            assetTokenProgram: collateralTokenProgram,
            sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
            eventAuthority: PDA.getEventAuthority(),
            program: config.program.programId
        };

        const addCollateralWithShares = config.program.methods.addCollateralToShortWithShares(
            ...params
        );
        addCollateralWithShares.accountsStrict({
            withdraw: withdrawAccounts,
            editPosition: addCollateralAccounts
        });

        return addCollateralWithShares
            .instruction()
            .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
    } else {
        const addCollateral = config.program.methods.addCollateralToShortPosition(...params);
        addCollateral.accountsStrict(addCollateralAccounts);

        return addCollateral
            .instruction()
            .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
    }
}
