import { Program, BN } from '@coral-xyz/anchor';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
} from '../base';
import {
    DepositAccounts,
    DepositArgs,
    TokenInstructionAccounts,
    getTokenInstructionAccounts
} from './tokenAccounts';
import { handleMint } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

const depositConfig: BaseMethodConfig<DepositArgs, DepositAccounts, TokenInstructionAccounts> = {
    process: async (config: ConfigArgs<DepositArgs, DepositAccounts>) => {
        const setup: TransactionInstruction[] = [];
        const { mint, tokenProgram, setupIx, cleanupIx } = await handleMint(
            config.program.provider.connection,
            config.accounts.assetMint,
            {
                owner: config.program.provider.publicKey,
                wrapMode: 'wrap',
                amount: config.args.amount,
                mintCache: config.mintCache
            }
        );

        setup.push(...setupIx);

        const accounts = await getTokenInstructionAccounts(config.program, mint, tokenProgram);

        const ownerShares = await config.program.provider.connection.getAccountInfo(
            accounts.ownerSharesAccount
        );

        if (!ownerShares) {
            setup.push(
                createAssociatedTokenAccountInstruction(
                    config.program.provider.publicKey,
                    accounts.ownerSharesAccount,
                    config.program.provider.publicKey,
                    accounts.sharesMint,
                    TOKEN_2022_PROGRAM_ID
                )
            );
        }

        return {
            accounts,
            args: config.args ? new BN(config.args.amount.toString()) : undefined,
            setup,
            cleanup: cleanupIx
        };
    },
    getMethod: (program) => (args) => program.methods.deposit(args)
};

export async function createDepositInstruction(
    program: Program<WasabiSolana>,
    args: DepositArgs,
    accounts: DepositAccounts,
): Promise<TransactionInstruction[]> {
    return handleMethodCall({
        program,
        accounts,
        config: depositConfig,
        args
    }) as Promise<TransactionInstruction[]>;
}
