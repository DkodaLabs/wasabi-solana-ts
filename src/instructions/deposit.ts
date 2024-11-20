import { Program, BN } from '@coral-xyz/anchor';
import {
    TransactionSignature,
    TransactionInstruction
} from '@solana/web3.js';
import {
    TOKEN_2022_PROGRAM_ID,
    createAssociatedTokenAccountInstruction
} from '@solana/spl-token';
import {
    BaseMethodConfig,
    handleMethodCall,
    ConfigArgs,
    constructMethodCallArgs
} from '../base';
import {
    DepositAccounts,
    DepositArgs,
    TokenInstructionAccounts,
    TokenInstructionAccountsStrict,
    getTokenInstructionAccounts,
    handleDepositMintWrapSol,
} from './tokenAccounts';
import { WasabiSolana } from '../idl/wasabi_solana';

const depositConfig: BaseMethodConfig<
    DepositArgs,
    DepositAccounts,
    TokenInstructionAccounts | TokenInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<DepositArgs, DepositAccounts>) => {
        const setup: TransactionInstruction[] = [];
        const {
            assetMint,
            assetTokenProgram,
            setupIx,
            cleanupIx,
        } = await handleDepositMintWrapSol(
            config.program.provider.connection,
            config.program.provider.publicKey,
            config.accounts.assetMint,
            config.args.amount,
        );

        setup.push(...setupIx);

        const allAccounts = await getTokenInstructionAccounts(
            config.program,
            assetMint,
            assetTokenProgram
        );

        const ownerShares = await config.program.provider.connection.getAccountInfo(
            allAccounts.ownerSharesAccount
        );

        if (!ownerShares) {
            setup.push(
                createAssociatedTokenAccountInstruction(
                    config.program.provider.publicKey,
                    allAccounts.ownerSharesAccount,
                    config.program.provider.publicKey,
                    allAccounts.sharesMint,
                    TOKEN_2022_PROGRAM_ID
                )
            );
        }

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: config.program.provider.publicKey,
                    lpVault: allAccounts.lpVault,
                    assetMint: config.accounts.assetMint,
                    assetTokenProgram
                },
            args: config.args ? new BN(config.args.amount) : undefined,
            setup,
            cleanup: cleanupIx,
        };
    },
    getMethod: (program) => (args) => program.methods.deposit(args)
};

export async function createDepositInstruction(
    program: Program<WasabiSolana>,
    args: DepositArgs,
    accounts: DepositAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            depositConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function deposit(
    program: Program<WasabiSolana>,
    args: DepositArgs,
    accounts: DepositAccounts,
    strict: boolean = true,
    increaseCompute = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            depositConfig,
            'transaction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
