import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionAccounts, OpenPositionArgs } from './openPosition';
import { extractInstructionData } from './shared';
import { getTokenProgram, MintCache, PDA } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl';
import { OpenLongPositionInstructionAccounts } from './openLongPositionV2';

const updateLongPositionConfig: BaseMethodConfig<
    OpenPositionArgs,
    OpenPositionAccounts,
    OpenLongPositionInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionArgs, OpenPositionAccounts>) => {
        const { hops, data, remainingAccounts } = extractInstructionData(config.args.instructions);

        const [tokenProgram, collateralTokenProgram] = await Promise.all([
            getTokenProgram(config.program.provider.connection, config.accounts.currency),
            getTokenProgram(config.program.provider.connection, config.accounts.collateral)
        ]);

        const lpVault = PDA.getLpVault(config.accounts.currency);
        const pool = PDA.getLongPool(config.accounts.collateral, config.accounts.currency);

        if (!config.args.positionId) {
            throw new Error('positionId is required for `IncreaseLongPosition`');
        }

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    config.accounts.owner,
                    false,
                    tokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    lpVault,
                    true,
                    tokenProgram
                ),
                pool,
                currencyVault: getAssociatedTokenAddressSync(
                    config.accounts.currency,
                    pool,
                    true,
                    tokenProgram
                ),
                collateralVault: getAssociatedTokenAddressSync(
                    config.accounts.collateral,
                    pool,
                    true,
                    collateralTokenProgram
                ),
                currency: config.accounts.currency,
                collateral: config.accounts.collateral,
                position: new PublicKey(config.args.positionId),
                authority: config.accounts.authority,
                permission: PDA.getAdmin(config.accounts.authority),
                feeWallet: config.accounts.feeWallet,
                tokenProgram,
                debtController: PDA.getDebtController(),
                globalSettings: PDA.getGlobalSettings(),
                systemProgram: SystemProgram.programId
            },
            args: {
                ...config.args,
                hops,
                data
            },
            remainingAccounts
        };
    },
    getMethod: (program) => (args) =>
        program.methods.updateLongPosition(
            new BN(args.minTargetAmount),
            new BN(args.downPayment),
            new BN(args.principal),
            new BN(args.fee),
            new BN(args.expiration),
            { hops: args.hops },
            args.data
        )
};

export async function createUpdateLongPositionInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionArgs,
    accounts: OpenPositionAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: updateLongPositionConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
