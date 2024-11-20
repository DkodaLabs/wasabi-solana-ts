import { Program, BN } from '@coral-xyz/anchor';
import { TransactionSignature, TransactionInstruction } from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs
} from '../base';
import {
    MintArgs,
    MintAccounts,
    TokenInstructionAccounts,
    TokenInstructionAccountsStrict,
    getTokenInstructionAccounts,
} from './tokenAccounts';
import { handleMint } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export const mintConfig: BaseMethodConfig<
    MintArgs,
    MintAccounts,
    TokenInstructionAccounts | TokenInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<MintArgs, MintAccounts>) => {
        const {
            mint,
            tokenProgram,
            setupIx,
            cleanupIx,
        } = await handleMint(
            config.program.provider.connection,
            config.accounts.assetMint,
            config.program.provider.publicKey,
            'wrap',
            config.args.amount,
        );

        const allAccounts = await getTokenInstructionAccounts(
            config.program,
            mint,
            tokenProgram,
        );

        return {
            accounts: config.strict
                ? allAccounts
                : {
                    owner: config.program.provider.publicKey,
                    lpVault: allAccounts.lpVault,
                    assetMint: mint,
                    assetTokenProgram: tokenProgram,
                },
            args: config.args ? new BN(config.args.amount) : undefined,
            setup: setupIx,
            cleanup: cleanupIx,
        };
    },
    getMethod: (program) => (args) => program.methods.mint(args)
};

export async function createMintInstruction(
    program: Program<WasabiSolana>,
    args: MintArgs,
    accounts: MintAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            mintConfig,
            'instruction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function mint(
    program: Program<WasabiSolana>,
    args: MintArgs,
    accounts: MintAccounts,
    strict: boolean = true,
    increaseCompute: boolean = false
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            accounts,
            mintConfig,
            'transaction',
            strict,
            increaseCompute,
            args
        )
    ) as Promise<TransactionSignature>;
}
