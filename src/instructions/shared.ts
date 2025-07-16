import { AccountMeta, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ConfigArgs } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { handleOpenTokenAccounts, PDA, validateArgs } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';
import { OpenShortPositionInstructionAccounts } from './openShortPositionV2';
import { TokenInstructionAccounts } from './tokenAccounts';
import { BN } from '@coral-xyz/anchor';
import { AddCollateralAccounts, AddCollateralArgs } from './addCollateralToShortPosition';

export type Hop = {
    programId: PublicKey;
    dataStartIdx: number;
    dataSize: number;
    accountStartIdx: number;
    numAccounts: number;
};

// Program accounts still need to be loaded despite them not being used in the CPI.
// We insert the program account at the start of an instructions' account slice to ensure that it is loaded.
// This is why we need to offset the `accountStartIdx` by one (1) for each instruction and add one (1) to the account slice length.
export function extractInstructionData(instructions: TransactionInstruction[]): {
    hops: Hop[];
    data: Buffer;
    remainingAccounts: AccountMeta[];
} {
    let accountIdx = 0;
    let dataIdx = 0;
    let data = Buffer.alloc(0);

    const hops = [];
    const remainingAccounts = [];

    for (const ix of instructions) {
        const hop: Hop = {
            programId: ix.programId,
            dataStartIdx: dataIdx,
            dataSize: ix.data.length,
            accountStartIdx: accountIdx + 1,
            numAccounts: ix.keys.length
        };

        const programAccount: AccountMeta = {
            pubkey: ix.programId,
            isSigner: false,
            isWritable: false
        };

        hops.push(hop);
        data = Buffer.concat([data, ix.data]);
        dataIdx += ix.data.length;
        accountIdx += ix.keys.length + 1;
        remainingAccounts.push(programAccount, ...ix.keys);
    }

    return { hops, data, remainingAccounts };
}

export type ProcessPositionOptions = {
    useShares: boolean;
    isUpdate: boolean;
    isShort: boolean;
    methodName: string;
};

export async function processPositionInstruction(
    config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>,
    options: ProcessPositionOptions
): Promise<TransactionInstruction[]> {
    const { nonce, positionId, minTargetAmount, downPayment, principal, fee, expiration, instructions } = validateArgs(config.args);
    const { useShares, isUpdate, isShort, methodName } = options;
    const { hops, data, remainingAccounts } = extractInstructionData(instructions);

    const { ownerPaymentAta, currencyTokenProgram, collateralTokenProgram, setupIx, cleanupIx } =
        await handleOpenTokenAccounts({
            program: config.program,
            owner: config.accounts.owner,
            downPayment,
            fee,
            mintCache: config.mintCache,
            isLongPool: !isShort,
            currency: config.accounts.currency,
            collateral: config.accounts.collateral,
            useShares
        });

    if (!ownerPaymentAta) {
        throw new Error('Owner payment account does not exist');
    }

    const lpVault = PDA.getLpVault(config.accounts.currency);
    const vault = getAssociatedTokenAddressSync(
        config.accounts.currency,
        lpVault,
        true,
        currencyTokenProgram
    );
    const pool = isShort
        ? PDA.getShortPool(config.accounts.collateral, config.accounts.currency)
        : PDA.getLongPool(config.accounts.collateral, config.accounts.currency);


    const globalSettings = PDA.getGlobalSettings();

    let position: PublicKey;
    if (isUpdate) {
        if (!positionId) {
            throw new Error(`positionId is required for \`${methodName}\``);
        }
        position = new PublicKey(positionId);
    } else {
        if (!nonce) {
            throw new Error(`Nonce is required for \`${methodName}\``);
        }
        position = PDA.getPosition(config.accounts.owner, pool, lpVault, nonce)
    }

    const createUpdateParams = () => [
        new BN(minTargetAmount.toString()),
        new BN(downPayment.toString()),
        new BN(principal.toString()),
        new BN(fee.toString()),
        new BN(expiration.toString()),
        { hops },
        data
    ] as const;

    const createOpenParams = () => [
        nonce || 0,
        new BN(minTargetAmount.toString()),
        new BN(downPayment.toString()),
        new BN(principal.toString()),
        new BN(fee.toString()),
        new BN(expiration.toString()),
        { hops },
        data
    ] as const;

    const commonWithdrawAccounts = {
        owner: config.accounts.owner,
        ownerAssetAccount: ownerPaymentAta,
        globalSettings,
        assetTokenProgram: currencyTokenProgram,
        sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
        eventAuthority: PDA.getEventAuthority(),
        program: config.program.programId
    };

    const commonPositionAccounts = {
        owner: config.accounts.owner,
        lpVault,
        vault,
        pool,
        currencyVault: getAssociatedTokenAddressSync(
            config.accounts.currency,
            pool,
            true,
            currencyTokenProgram
        ),
        collateralVault: getAssociatedTokenAddressSync(
            config.accounts.collateral,
            pool,
            true,
            collateralTokenProgram
        ),
        currency: config.accounts.currency,
        collateral: config.accounts.collateral,
        position,
        authority: config.accounts.authority,
        permission: PDA.getAdmin(config.accounts.authority),
        feeWallet: config.accounts.feeWallet,
        debtController: PDA.getDebtController(),
        globalSettings,
        systemProgram: SystemProgram.programId
    };

    if (isShort) {
        const shortPositionAccounts: OpenShortPositionInstructionAccounts = {
            ...commonPositionAccounts,
            ownerTargetCurrencyAccount: ownerPaymentAta,
            currencyTokenProgram,
            collateralTokenProgram
        };

        if (useShares) {
            // For short positions with shares, we use the collateral for withdraw
            const withdrawLpVault = PDA.getLpVault(config.accounts.collateral);
            const withdrawVault = getAssociatedTokenAddressSync(
                config.accounts.collateral,
                withdrawLpVault,
                true,
                collateralTokenProgram
            );
            const sharesMint = PDA.getSharesMint(withdrawLpVault, config.accounts.collateral);

            const withdrawAccounts: TokenInstructionAccounts = {
                ...commonWithdrawAccounts,
                ownerSharesAccount: getAssociatedTokenAddressSync(
                    sharesMint,
                    config.accounts.owner,
                    false,
                    TOKEN_2022_PROGRAM_ID
                ),
                lpVault: withdrawLpVault,
                vault: withdrawVault,
                assetMint: config.accounts.collateral,
                sharesMint,
                assetTokenProgram: collateralTokenProgram
            };

            if (isUpdate) {
                const editShortShares = config.program.methods.increaseShortWithShares(...createUpdateParams());
                editShortShares.remainingAccounts(remainingAccounts);
                editShortShares.accountsStrict({
                    withdraw: withdrawAccounts,
                    editPosition: shortPositionAccounts
                });

                return editShortShares
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            } else {
                const openShortShares = config.program.methods.openShortWithShares(...createOpenParams());
                openShortShares.remainingAccounts(remainingAccounts);
                openShortShares.accountsStrict({
                    withdraw: withdrawAccounts,
                    openPosition: shortPositionAccounts
                });

                return openShortShares
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            }
        } else {
            if (isUpdate) {
                const increaseShortPosition = config.program.methods.increaseShortPosition(...createUpdateParams());
                increaseShortPosition.remainingAccounts(remainingAccounts);
                increaseShortPosition.accountsStrict({ ...shortPositionAccounts });

                return increaseShortPosition.instruction().then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            } else {
                const openShortPosition = config.program.methods.openShortPosition(...createOpenParams());
                openShortPosition.remainingAccounts(remainingAccounts);
                openShortPosition.accountsStrict(shortPositionAccounts);

                return openShortPosition
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            }
        }
    } else {
        const longPositionAccounts: OpenLongPositionInstructionAccounts = {
            ...commonPositionAccounts,
            ownerCurrencyAccount: ownerPaymentAta,
            tokenProgram: currencyTokenProgram
        };

        if (useShares) {
            const sharesMint = PDA.getSharesMint(lpVault, config.accounts.currency);

            const withdrawAccounts: TokenInstructionAccounts = {
                ...commonWithdrawAccounts,
                ownerSharesAccount: getAssociatedTokenAddressSync(
                    sharesMint,
                    config.accounts.owner,
                    false,
                    TOKEN_2022_PROGRAM_ID
                ),
                lpVault,
                vault,
                assetMint: config.accounts.currency,
                sharesMint,
                assetTokenProgram: currencyTokenProgram
            };

            if (isUpdate) {
                const updateLongShares = config.program.methods.updateLongWithShares(...createUpdateParams());
                updateLongShares.remainingAccounts(remainingAccounts);
                updateLongShares.accountsStrict({
                    withdraw: withdrawAccounts,
                    editPosition: longPositionAccounts
                });

                return updateLongShares
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            } else {
                const openLongShares = config.program.methods.openLongWithShares(...createOpenParams());
                openLongShares.accountsStrict({
                    withdraw: withdrawAccounts,
                    openPosition: longPositionAccounts
                });
                openLongShares.remainingAccounts(remainingAccounts);

                return openLongShares
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            }
        } else {
            if (isUpdate) {
                const updateLongPosition = config.program.methods.updateLongPosition(...createUpdateParams());
                updateLongPosition.remainingAccounts(remainingAccounts);
                updateLongPosition.accountsStrict({ ...longPositionAccounts });

                return updateLongPosition.instruction().then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            } else {
                const openPosition = config.program.methods.openLongPosition(...createOpenParams());
                openPosition.accountsStrict(longPositionAccounts);
                openPosition.remainingAccounts(remainingAccounts);

                return openPosition
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            }
        }
    }
}

export async function processAddCollateralInstruction(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    options: {
        useShares: boolean;
        isLong: boolean;
    }
): Promise<TransactionInstruction[]> {
    const { useShares, isLong } = options;
    const args = validateArgs(config.args);
    const authority = config.accounts.authority  || config.program.provider.publicKey;

    const position = await config.program.account.position.fetchNullable(config.accounts.position);
    if (!position) throw new Error('Position not found');

    const pool = isLong
        ? PDA.getLongPool(position.collateral, position.currency)
        : PDA.getShortPool(position.collateral, position.currency);

    const { ownerPaymentAta, setupIx, cleanupIx, currencyTokenProgram, collateralTokenProgram } =
        await handleOpenTokenAccounts({
            program: config.program,
            owner: config.accounts.owner,
            mintCache: config.mintCache,
            downPayment: args.amount,
            fee: isLong ? args.interest : 0,
            currency: position.currency,
            collateral: position.collateral,
            isLongPool: isLong,
            useShares
        });

    if (!ownerPaymentAta) {
        throw new Error('Owner payment account does not exist');
    }

    const createShortParams = () => [
        new BN(args.amount.toString()),
        new BN(args.expiration.toString())
    ] as const;

    const createLongParams = () => [
        new BN(args.amount.toString()),
        new BN(args.interest.toString()),
        new BN(args.expiration.toString())
    ] as const;

    const globalSettings = PDA.getGlobalSettings();
    const permission = PDA.getAdmin(authority);
    const createShortAccounts = () => ({
        owner: config.accounts.owner,
        ownerTargetCurrencyAccount: ownerPaymentAta,
        position: config.accounts.position,
        pool,
        collateralVault: position.collateralVault,
        collateral: position.collateral,
        authority,
        permission,
        globalSettings,
        tokenProgram: collateralTokenProgram,
    });

    const createLongAccounts = () => ({
        owner: config.accounts.owner,
        ownerCurrencyAccount: ownerPaymentAta,
        lpVault: PDA.getLpVault(position.currency),
        vault: getAssociatedTokenAddressSync(
            position.currency,
            PDA.getLpVault(position.currency),
            true,
            currencyTokenProgram
        ),
        position: config.accounts.position,
        pool,
        currency: position.currency,
        authority,
        permission,
        globalSettings,
        tokenProgram: currencyTokenProgram,
        eventAuthority: PDA.getEventAuthority(),
        program: config.program.programId
    });

    const createWithdrawAccounts = (asset: PublicKey, lpVault: PublicKey, vault: PublicKey, sharesMint: PublicKey, tokenProgram: PublicKey) => ({
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
        assetMint: asset,
        sharesMint,
        globalSettings: PDA.getGlobalSettings(),
        assetTokenProgram: tokenProgram,
        sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
        eventAuthority: PDA.getEventAuthority(),
        program: config.program.programId
    });

    if (!isLong) {
        if (useShares) {
            const lpVault = PDA.getLpVault(position.collateral);
            const vault = getAssociatedTokenAddressSync(position.collateral, lpVault, true, currencyTokenProgram);
            const sharesMint = PDA.getSharesMint(lpVault, position.collateral);
            const withdrawAccounts = createWithdrawAccounts(position.collateral, lpVault, vault, sharesMint, currencyTokenProgram);

            const addCollateral = config.program.methods.addCollateralToShortWithShares(...createShortParams());
            addCollateral.accountsStrict({
                withdraw: withdrawAccounts,
                editPosition: createShortAccounts()
            });

            return addCollateral.instruction().then((ix: TransactionInstruction) => [
                ...(setupIx || []),
                ix,
                ...(cleanupIx || [])
            ]);
        } else {
            const addCollateral = config.program.methods.addCollateralToShortPosition(...createShortParams());
            addCollateral.accountsStrict(createShortAccounts());

            return addCollateral.instruction().then((ix: TransactionInstruction) => [
                ...(setupIx || []),
                ix,
                ...(cleanupIx || [])
            ]);
        }
    } else {
        if (useShares) {
            const lpVault = PDA.getLpVault(position.currency);
            const vault = getAssociatedTokenAddressSync(position.currency, lpVault, true, currencyTokenProgram);
            const sharesMint = PDA.getSharesMint(lpVault, position.currency);
            const withdrawAccounts = createWithdrawAccounts(position.currency, lpVault, vault, sharesMint, currencyTokenProgram);

            const addCollateral = config.program.methods.addCollateralToLongWithShares(...createLongParams());
            addCollateral.accountsStrict({
                withdraw: withdrawAccounts,
                editPosition: createLongAccounts()
            });

            return addCollateral.instruction().then((ix: TransactionInstruction) => [
                ...(setupIx || []),
                ix,
                ...(cleanupIx || [])
            ]);
        } else {
            const addCollateral = config.program.methods.addCollateralToLongPosition(...createLongParams());
            addCollateral.accountsStrict(createLongAccounts());

            return addCollateral.instruction().then((ix: TransactionInstruction) => [
                ...(setupIx || []),
                ix,
                ...(cleanupIx || [])
            ]);
        }
    }
}
