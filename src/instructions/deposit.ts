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
import { handleMint, validateArgs, validateProviderPayer } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

const depositConfig: BaseMethodConfig<DepositArgs, DepositAccounts, TokenInstructionAccounts> = {
    process: async (config: ConfigArgs<DepositArgs, DepositAccounts>) => {
        const args = validateArgs(config.args);
        const payer = validateProviderPayer(config.program.provider.publicKey);

        const setup: TransactionInstruction[] = [];
        const { mint, tokenProgram, setupIx, cleanupIx } = await handleMint(
            config.program.provider.connection,
            config.accounts.assetMint,
            {
                owner: config.program.provider.publicKey,
                wrapMode: 'wrap',
                amount: args.amount,
                mintCache: config.mintCache
            }
        );

        if (setupIx) {
            setup.push(...setupIx);
        }

        const accounts = await getTokenInstructionAccounts(config.program, mint, tokenProgram);

        const ownerShares = await config.program.provider.connection.getAccountInfo(
            accounts.ownerSharesAccount
        );

        if (!ownerShares) {
            setup.push(
                createAssociatedTokenAccountInstruction(
                    payer,
                    accounts.ownerSharesAccount,
                    payer,
                    accounts.sharesMint,
                    TOKEN_2022_PROGRAM_ID
                )
            );
        }

        return {
            accounts,
            args: new BN(args.amount.toString()),
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
