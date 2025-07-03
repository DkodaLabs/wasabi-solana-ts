import { AccountMeta, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { ConfigArgs } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { handleOpenTokenAccounts, PDA } from '../utils';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';
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

export type OpenWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    openPosition: OpenLongPositionInstructionAccounts;
};

export type UpdateWithSharesInstructionAccounts = {
    withdraw: TokenInstructionAccounts;
    editPosition: OpenLongPositionInstructionAccounts;
};

export type WithSharesInstructionAccounts = OpenWithSharesInstructionAccounts | UpdateWithSharesInstructionAccounts;

export type ProcessPositionOptions = {
    useShares: boolean;
    isUpdate: boolean;
    methodName: string;
};

export async function processPositionInstruction<T extends OpenLongPositionInstructionAccounts | WithSharesInstructionAccounts>(
    config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>,
    options: ProcessPositionOptions
): Promise<{
    accounts: T;
    args: any;
    setup: TransactionInstruction[];
    cleanup: TransactionInstruction[];
    remainingAccounts: AccountMeta[];
}> {
    const { useShares, isUpdate, methodName } = options;

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

    const {
        ownerPaymentAta,
        currencyTokenProgram,
        collateralTokenProgram,
        setupIx,
        cleanupIx
    } = await handleOpenTokenAccounts({
        program: config.program,
        owner: config.accounts.owner,
        downPayment: config.args.downPayment,
        fee: config.args.fee,
        mintCache: config.mintCache,
        isLongPool: true,
        currency: config.accounts.currency,
        collateral: config.accounts.collateral,
        useShares,
    });

    const lpVault = PDA.getLpVault(config.accounts.currency);
    const vault = getAssociatedTokenAddressSync(
        config.accounts.currency,
        lpVault,
        true,
        currencyTokenProgram
    );
    const pool = PDA.getLongPool(config.accounts.collateral, config.accounts.currency);

    const position = isUpdate
        ? new PublicKey(config.args.positionId)
        : PDA.getPosition(config.accounts.owner, pool, lpVault, config.args.nonce);

    const positionAccounts: OpenLongPositionInstructionAccounts = {
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
            return {
                accounts: {
                    withdraw: withdrawAccounts,
                    editPosition: positionAccounts
                } as T,
                args: {
                    ...config.args,
                    hops,
                    data
                },
                setup: setupIx,
                cleanup: cleanupIx,
                remainingAccounts
            };
        } else {
            return {
                accounts: {
                    withdraw: withdrawAccounts,
                    openPosition: positionAccounts
                } as T,
                args: {
                    ...config.args,
                    hops,
                    data
                },
                setup: setupIx,
                cleanup: cleanupIx,
                remainingAccounts
            };
        }
    } else {
        return {
            accounts: positionAccounts as T,
            args: {
                ...config.args,
                hops,
                data
            },
            setup: setupIx,
            cleanup: cleanupIx,
            remainingAccounts
        };
    }
}

export function createPositionMethodBuilder(methodName: string, isUpdate: boolean) {
    return (program) => (args) => {
        const commonParams = [
            new BN(args.minTargetAmount),
            new BN(args.downPayment),
            new BN(args.principal),
            new BN(args.fee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        ];

        if (!isUpdate) {
            return program.methods[methodName](
                args.nonce || 0,
                ...commonParams
            );
        } else {
            return program.methods[methodName](
                ...commonParams
            );
        }
    };
}
