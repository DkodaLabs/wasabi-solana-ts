import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import {
    ClosePositionAccounts,
    ClosePositionArgs,
    ClosePositionInternalInstructionAccounts
} from './closePositionV2';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { extractInstructionData } from './shared';
import { PDA } from '../utils';
import {
    createAssociatedTokenAccountIdempotentInstruction,
    createCloseAccountInstruction,
    getAssociatedTokenAddressSync,
    NATIVE_MINT,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { SYSTEM_PROGRAM_ID } from '@coral-xyz/anchor/dist/cjs/native/system';

type TakeProfitInstructionAccounts = {
    takeProfitOrder: PublicKey;
    closePosition: ClosePositionInternalInstructionAccounts;
};

const takeProfitConfig: BaseMethodConfig<
    ClosePositionArgs,
    ClosePositionAccounts,
    TakeProfitInstructionAccounts
> = {
    process: async (config: ConfigArgs<ClosePositionArgs, ClosePositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const poolAccount = await config.program.account.basePool.fetchNullable(
            config.accounts.pool
        );

        if (!poolAccount) {
            throw new Error('Pool does not exist');
        }

        const payoutMint = poolAccount.isLongPool ? poolAccount.currency : poolAccount.collateral;
        const accountsToFetch = [poolAccount.currency, poolAccount.collateral];

        if (payoutMint.equals(NATIVE_MINT)) {
            const ownerWrapped = getAssociatedTokenAddressSync(
                NATIVE_MINT,
                config.accounts.owner,
                false,
                TOKEN_PROGRAM_ID
            );

            accountsToFetch.push(ownerWrapped);
        }

        const fetchedAccounts = await config.program.provider.connection.getMultipleAccountsInfo(
            accountsToFetch
        );

        const currencyTokenProgram = fetchedAccounts[0].owner;
        const collateralTokenProgram = fetchedAccounts[1].owner;
        const ownerPayoutAccount = fetchedAccounts[2]
            ? getAssociatedTokenAddressSync(
                  NATIVE_MINT,
                  config.accounts.owner,
                  false,
                  TOKEN_PROGRAM_ID
              )
            : getAssociatedTokenAddressSync(
                  payoutMint,
                  config.accounts.owner,
                  false,
                  poolAccount.isLongPool ? currencyTokenProgram : collateralTokenProgram
              );

        const setupIx: TransactionInstruction[] = [];
        const cleanupIx: TransactionInstruction[] = [];
        if (!fetchedAccounts[2]) {
            setupIx.push(
                createAssociatedTokenAccountIdempotentInstruction(
                    config.accounts.owner,
                    ownerPayoutAccount,
                    config.accounts.owner,
                    NATIVE_MINT,
                    TOKEN_PROGRAM_ID
                )
            );
            cleanupIx.push(
                createCloseAccountInstruction(
                    ownerPayoutAccount,
                    config.accounts.owner,
                    config.accounts.owner,
                    [],
                    TOKEN_PROGRAM_ID
                )
            );
        }

        const lpVault = PDA.getLpVault(poolAccount.currency);

        return {
            accounts: {
                takeProfitOrder: PDA.getTakeProfitOrder(config.accounts.position),
                closePosition: {
                    owner: config.accounts.owner,
                    ownerPayoutAccount,
                    lpVault,
                    vault: getAssociatedTokenAddressSync(
                        poolAccount.currency,
                        lpVault,
                        true,
                        currencyTokenProgram
                    ),
                    pool: config.accounts.pool,
                    currencyVault: poolAccount.currencyVault,
                    collateralVault: poolAccount.collateralVault,
                    currency: poolAccount.currency,
                    collateral: poolAccount.collateral,
                    position: config.accounts.position,
                    authority: config.accounts.authority,
                    permission: PDA.getAdmin(config.accounts.authority),
                    feeWallet: config.accounts.feeWallet,
                    liquidationWallet: config.accounts.liquidationWallet,
                    debtController: PDA.getDebtController(),
                    globalSettings: PDA.getGlobalSettings(),
                    currencyTokenProgram,
                    collateralTokenProgram,
                    systemProgram: SYSTEM_PROGRAM_ID
                }
            },
            args: {
                ...config.args,
                hops,
                data
            },
            setup: setupIx,
            cleanup: cleanupIx,
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.takeProfit(
            new BN(args.minTargetAmount),
            new BN(args.interest),
            new BN(args.executionFee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createTakeProfitInstruction(
    program: Program<WasabiSolana>,
    args: ClosePositionArgs,
    accounts: ClosePositionAccounts
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: takeProfitConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
