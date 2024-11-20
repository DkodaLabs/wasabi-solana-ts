import { BN, Program } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import { PDA, handleMint } from '../utils';

export type RepayArgs = {
    amount: number | bigint; // u64
};

export type RepayAccounts = {
    mint: PublicKey;
};

type RepayInstructionAccounts = {
    mint: PublicKey;
    lpVault: PublicKey;
    tokenProgram: PublicKey;
};

type RepayInstructionAccountsStrict = {} & RepayInstructionAccounts;

const repayConfig: BaseMethodConfig<
    RepayArgs,
    RepayAccounts,
    RepayInstructionAccounts | RepayInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<RepayArgs, RepayAccounts>) => {
        const {
            mint,
            tokenProgram,
            setupIx,
            cleanupIx,
        } = await handleMint(
            config.program.provider.connection,
            config.accounts.mint,
            config.program.provider.publicKey,
            'wrap',
        );
        const lpVault = PDA.getLpVault(mint);
        const lpVaultInfo = await config.program.account.lpVault.fetch(lpVault);

        const allAccounts = {
            payer: config.program.provider.publicKey,
            mint,
            source: getAssociatedTokenAddressSync(
                mint,
                config.program.provider.publicKey,
                false,
                tokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(mint, lpVault, true, tokenProgram),
            tokenProgram
        };

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    payer: allAccounts.payer,
                    mint: allAccounts.mint,
                    source: allAccounts.source,
                    lpVault,
                    tokenProgram
                },
            args: lpVaultInfo.totalBorrowed.add(new BN(config.args.amount.toString())),
            setup: setupIx,
            cleanup: cleanupIx,
        };
    },
    getMethod: (program) => (args) => program.methods.repay(args)
};

export async function createRepayInstruction(
    program: Program<WasabiSolana>,
    args: RepayArgs,
    accounts: RepayAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            repayConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function repay(
    program: Program<WasabiSolana>,
    args: RepayArgs,
    accounts: RepayAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            repayConfig,
            'transaction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
