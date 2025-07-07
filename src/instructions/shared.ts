import { AccountMeta, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ConfigArgs } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { handleOpenTokenAccounts, PDA } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';
import { OpenShortPositionInstructionAccounts } from './openShortPositionV2';
import {
    AddCollateralArgs,
    AddCollateralAccounts,
    AddCollateralInstructionAccounts
} from './addCollateralToShortPosition';
import { TokenInstructionAccounts } from './tokenAccounts';
import { BN } from '@coral-xyz/anchor';

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

export type OpenLongWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    openPosition: OpenLongPositionInstructionAccounts;
};

export type UpdateLongWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    editPosition: OpenLongPositionInstructionAccounts;
};

export type OpenShortWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    openPosition: OpenShortPositionInstructionAccounts;
};

export type UpdateShortWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    editPosition: OpenShortPositionInstructionAccounts;
};

export type AddCollateralWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    addCollateral: AddCollateralInstructionAccounts;
};

export type OpenWithSharesInstructionAccounts =
    | OpenLongWithSharesInstructionAccounts
    | OpenShortWithSharesInstructionAccounts;
export type UpdateWithSharesInstructionAccounts =
    | UpdateLongWithSharesInstructionAccounts
    | UpdateShortWithSharesInstructionAccounts;
export type WithSharesInstructionAccounts =
    | OpenWithSharesInstructionAccounts
    | UpdateWithSharesInstructionAccounts
    | AddCollateralWithSharesInstructionAccounts;

export type ProcessPositionOptions = {
    useShares: boolean;
    isUpdate: boolean;
    isShort: boolean;
    methodName: string;
};

export async function processPositionInstruction<
    T extends
        | OpenLongPositionInstructionAccounts
        | OpenShortPositionInstructionAccounts
        | WithSharesInstructionAccounts
>(
    config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>,
    options: ProcessPositionOptions
): Promise<TransactionInstruction[]> {
    const { useShares, isUpdate, isShort, methodName } = options;

    if (isUpdate) {
        if (!config.args.positionId) {
            throw new Error(`positionId is required for \`${methodName}\``);
        }
    } else {
        if (!config.args.nonce) {
            throw new Error(`Nonce is required for \`${methodName}\``);
        }
    }

    const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

    const { ownerPaymentAta, currencyTokenProgram, collateralTokenProgram, setupIx, cleanupIx } =
        await handleOpenTokenAccounts({
            program: config.program,
            owner: config.accounts.owner,
            downPayment: config.args.downPayment,
            fee: config.args.fee,
            mintCache: config.mintCache,
            isLongPool: !isShort,
            currency: config.accounts.currency,
            collateral: config.accounts.collateral,
            useShares
        });

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

    const position = isUpdate
        ? new PublicKey(config.args.positionId)
        : PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce);

    let params = [
        new BN(config.args.minTargetAmount),
        new BN(config.args.downPayment),
        new BN(config.args.principal),
        new BN(config.args.fee),
        new BN(config.args.expiration),
        { hops },
        data
    ];

    if (!isUpdate) {
        params = [config.args.nonce || 0, ...params];
    }

    if (isShort) {
        const shortPositionAccounts: OpenShortPositionInstructionAccounts = {
            owner: config.accounts.owner,
            ownerTargetCurrencyAccount: ownerPaymentAta,
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
            globalSettings: PDA.getGlobalSettings(),
            currencyTokenProgram,
            collateralTokenProgram,
            systemProgram: SystemProgram.programId
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
                lpVault: withdrawLpVault,
                vault: withdrawVault,
                assetMint: config.accounts.collateral,
                sharesMint,
                globalSettings,
                assetTokenProgram: collateralTokenProgram,
                sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
                eventAuthority: PDA.getEventAuthority(),
                program: config.program.programId
            };

            if (isUpdate) {
                const editShortShares = config.program.methods.increaseShortWithShares(params);
                editShortShares.remainingAccounts(remainingAccounts);
                editShortShares.accountsStrict({
                    withdraw: withdrawAccounts,
                    editPosition: shortPositionAccounts
                });

                return editShortShares
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            } else {
                const openShortShares = config.program.methods.openShortWithShares(params);
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
            const openShortPosition = config.program.methods.openShortPosition(params);
            openShortPosition.remainingAccounts(remainingAccounts);
            openShortPosition.accountsStrict(shortPositionAccounts);

            return openShortPosition
                .instruction()
                .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
        }
    } else {
        const longPositionAccounts: OpenLongPositionInstructionAccounts = {
            owner: config.accounts.owner,
            ownerCurrencyAccount: ownerPaymentAta,
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
            tokenProgram: currencyTokenProgram,
            debtController: PDA.getDebtController(),
            globalSettings: PDA.getGlobalSettings(),
            systemProgram: SystemProgram.programId
        };

        if (useShares) {
            const sharesMint = PDA.getSharesMint(lpVault, config.accounts.currency);
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
                assetMint: config.accounts.currency,
                sharesMint,
                globalSettings,
                assetTokenProgram: currencyTokenProgram,
                sharesTokenProgram: TOKEN_2022_PROGRAM_ID,
                eventAuthority: PDA.getEventAuthority(),
                program: config.program.programId
            };

            if (isUpdate) {
                const updateLongShares = config.program.methods.updateLongWithShares(params);
                updateLongShares.remainingAccounts(remainingAccounts);
                updateLongShares.accountsStrict({
                    withdraw: withdrawAccounts,
                    editPosition: longPositionAccounts
                });

                return updateLongShares
                    .instruction()
                    .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
            } else {
                const openLongShares = config.program.methods.openLongWithShares(params);
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
            const openPosition = config.program.methods.openLongPosition(params);
            openPosition.accountsStrict(longPositionAccounts);
            openPosition.remainingAccounts(remainingAccounts);

            return openPosition
                .instruction()
                .then((ix) => [...(setupIx || []), ix, ...(cleanupIx || [])]);
        }
    }
}

export async function processAddCollateralInstruction<
    T extends AddCollateralInstructionAccounts | AddCollateralWithSharesInstructionAccounts
>(
    config: ConfigArgs<AddCollateralArgs, AddCollateralAccounts>,
    options: {
        useShares: boolean;
        methodName: string;
    }
): Promise<{
    accounts: T;
    args: any;
    setup: TransactionInstruction[];
    cleanup: TransactionInstruction[];
}> {
    const { useShares, methodName } = options;

    const position = await config.program.account.position.fetchNullable(config.accounts.position);
    if (!position) throw new Error('Position not found');

    const pool = PDA.getShortPool(position.collateral, position.currency);

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

        return {
            accounts: {
                withdraw: withdrawAccounts,
                addCollateral: addCollateralAccounts
            } as T,
            args: {
                downPayment: config.args.downPayment,
                feesToPaid: config.args.fee,
                expiration: config.args.expiration
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    } else {
        return {
            accounts: addCollateralAccounts as T,
            args: {
                downPayment: config.args.downPayment,
                feesToPaid: config.args.fee,
                expiration: config.args.expiration
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    }
}

export function createAddCollateralMethodBuilder(methodName: string) {
    return (program) => (args) => {
        return program.methods[methodName](
            new BN(args.downPayment),
            new BN(args.feesToPaid),
            new BN(args.expiration)
        );
    };
}
