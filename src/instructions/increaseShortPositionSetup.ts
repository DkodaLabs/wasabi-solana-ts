import { BaseMethodConfig, ConfigArgs, handleMethodCall } from '../base';
import { OpenPositionSetupAccounts, OpenPositionSetupArgs } from './openPosition';
import { getPermission, handlePaymentTokenMint, MintCache, PDA, validateArgs, validateProviderPayer } from '../utils';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
    PublicKey,
    SystemProgram,
    SYSVAR_INSTRUCTIONS_PUBKEY,
    TransactionInstruction
} from '@solana/web3.js';
import { BN, Program } from '@coral-xyz/anchor';
import { WasabiSolana } from '../idl/wasabi_solana';
import { OpenShortPositionSetupInstructionAccounts } from './openShortPosition';

const increaseShortPositionSetupConfig: BaseMethodConfig<
    OpenPositionSetupArgs,
    OpenPositionSetupAccounts,
    OpenShortPositionSetupInstructionAccounts
> = {
    process: async (config: ConfigArgs<OpenPositionSetupArgs, OpenPositionSetupAccounts>) => {
        const args = validateArgs(config.args);
        const authority = validateProviderPayer(config.program.provider.publicKey);

        if (!args.positionId) {
            throw new Error('positionId is required for increaseShortPositionSetup');
        }

        const position = new PublicKey(args.positionId);

        const {
            currencyMint,
            collateralMint,
            currencyTokenProgram,
            collateralTokenProgram,
            setupIx,
            cleanupIx
        } = await handlePaymentTokenMint(
            config.program.provider.connection,
            config.accounts.owner,
            config.accounts.collateral, // payment token mint
            config.accounts.currency,
            config.accounts.collateral,
            'wrap',
            Number(args.downPayment) + Number(args.fee)
        );
        const lpVault = PDA.getLpVault(currencyMint);
        const pool = PDA.getShortPool(collateralMint, currencyMint);

        return {
            accounts: {
                owner: config.accounts.owner,
                ownerCurrencyAccount: getAssociatedTokenAddressSync(
                    currencyMint,
                    config.accounts.owner,
                    false,
                    currencyTokenProgram
                ),
                ownerTargetCurrencyAccount: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.owner,
                    false,
                    collateralTokenProgram
                ),
                lpVault,
                vault: getAssociatedTokenAddressSync(
                    currencyMint,
                    lpVault,
                    true,
                    currencyTokenProgram
                ),
                pool,
                collateralVault: getAssociatedTokenAddressSync(
                    collateralMint,
                    pool,
                    true,
                    collateralTokenProgram
                ),
                currencyVault: getAssociatedTokenAddressSync(
                    currencyMint,
                    pool,
                    true,
                    currencyTokenProgram
                ),
                currency: currencyMint,
                collateral: collateralMint,
                openPositionRequest: PDA.getOpenPositionRequest(config.accounts.owner),
                position,
                authority,
                permission: await getPermission(config.program, authority),
                feeWallet: config.accounts.feeWallet,
                feeWalletAta: getAssociatedTokenAddressSync(
                    collateralMint,
                    config.accounts.feeWallet,
                    true,
                    collateralTokenProgram
                ),
                globalSettings: PDA.getGlobalSettings(),
                currencyTokenProgram,
                collateralTokenProgram,
                systemProgram: SystemProgram.programId,
                sysvarInfo: SYSVAR_INSTRUCTIONS_PUBKEY
            },
            args: {
                minTargetAmount: new BN(args.minTargetAmount),
                downPayment: new BN(args.downPayment),
                principal: new BN(args.principal),
                fee: new BN(args.fee),
                expiration: new BN(args.expiration)
            },
            setup: setupIx,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) =>
        program.methods.increaseShortPositionSetup(
            args.minTargetAmount,
            args.downPayment,
            args.principal,
            args.fee,
            args.expiration
        )
};

export async function createIncreaseShortPositionSetupInstruction(
    program: Program<WasabiSolana>,
    args: OpenPositionSetupArgs,
    accounts: OpenPositionSetupAccounts,
    mintCache?: MintCache
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: increaseShortPositionSetupConfig,
        args,
        mintCache
    }) as Promise<TransactionInstruction[]>;
}
