import {BN, Program} from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { BaseMethodConfig, ConfigArgs, handleMethodCall, constructMethodCallArgs } from '../base';
import { WasabiSolana } from '../idl/wasabi_solana';
import { PDA, getTokenProgram } from '../utils';

export type RepayArgs = {
    amount: bigint; // u64
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
        const lpVault = PDA.getLpVault(config.accounts.mint);
        const [lpVaultInfo, tokenProgram] = await Promise.all([
            config.program.account.lpVault.fetch(lpVault),
            getTokenProgram(config.program.provider.connection, config.accounts.mint)
        ]);

        const allAccounts = {
            payer: config.program.provider.publicKey,
            mint: config.accounts.mint,
            source: getAssociatedTokenAddressSync(
                config.accounts.mint,
                config.program.provider.publicKey,
                false,
                tokenProgram
            ),
            lpVault,
            vault: getAssociatedTokenAddressSync(config.accounts.mint, lpVault, true, tokenProgram),
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
            args: lpVaultInfo.totalBorrowed.add(new BN(config.args.amount.toString()))
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
