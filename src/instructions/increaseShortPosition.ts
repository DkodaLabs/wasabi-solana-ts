import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { extractInstructionData } from './shared';
import { handleOpenTokenAccounts, MintCache, PDA } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { OpenShortPositionInstructionAccounts } from './openShortPositionV2';

const increaseShortPositionConfig: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenShortPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getShortPool(config.accounts.collateral, config.accounts.currency);

        if (!config.args.positionId) {
            throw new Error('positionId is required for `IncreaseShortPosition`');
        }

        const position = new PublicKey(config.args.positionId);
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
            isLongPool: false,
            currency: config.accounts.currency,
            collateral: config.accounts.collateral
        });

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerTargetCurrencyAccount: ownerPaymentAta,
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    lpVault,
                    true,
                    currencyTokenProgram
                ),
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
        program.methods.increaseShortPosition(
            new BN(args.minTargetAmount),
            new BN(args.downPayment),
            new BN(args.principal),
            new BN(args.fee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createIncreaseShortPositionInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: increaseShortPositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
