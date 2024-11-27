import { Program } from '@coral-xyz/anchor';
import {
    TransactionInstruction,
    TransactionSignature,
    PublicKey,
    SystemProgram
} from '@solana/web3.js';
import {
    BaseMethodConfig,
    ConfigArgs,
    handleMethodCall,
    constructMethodCallArgs,
} from '../base';
import { PDA, getPermission } from '../utils';
import { WasabiSolana } from '../idl/wasabi_solana';

export type WalletType = 'FEE' | 'LIQUIDATION';

export type GenerateWalletArgs = {
    walletType: WalletType,
    nonce: number, // u8
}

type GenerateWalletInstructionAccounts = {
    authority: PublicKey;
    permission: PublicKey;
}

type GenerateWalletInstructionAccountsStrict = GenerateWalletInstructionAccounts & {
    protocolWallet: PublicKey;
    globalSettings: PublicKey;
    systemProgram: PublicKey;
}

export const generateWalletConfig: BaseMethodConfig<
    GenerateWalletArgs,
    null,
    GenerateWalletInstructionAccounts | GenerateWalletInstructionAccountsStrict
> = {
    process: async (config: ConfigArgs<GenerateWalletArgs, null>) => {
        const allAccounts = {
            authority: config.program.provider.publicKey,
            protocolWallet: config.args.walletType === 'FEE'
                ? PDA.getFeeWallet(config.args.nonce)
                : PDA.getLiquidationWallet(config.args.nonce),
            permission: await getPermission(config.program, config.program.provider.publicKey),
            globalSettings: PDA.getGlobalSettings(),
            systemProgram: SystemProgram.programId,
        };

        return {
            accounts: config.strict ? allAccounts
                : {
                    authority: allAccounts.authority,
                    permission: allAccounts.permission,
                },
            args: config.args,
        }
    },
    getMethod: (program) => (args) => program.methods.generateWallet(args.walletType, args.nonce)
}

export async function createGenerateWalletInstruction(
    program: Program<WasabiSolana>,
    args: GenerateWalletArgs,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionInstruction[]> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            null,
            generateWalletConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionInstruction[]>;
}

export async function generateWallet(
    program: Program<WasabiSolana>,
    args: GenerateWalletArgs,
    strict: boolean = true,
    increaseCompute: boolean = false,
): Promise<TransactionSignature> {
    return handleMethodCall(
        constructMethodCallArgs(
            program,
            null,
            generateWalletConfig,
            'INSTRUCTION',
            strict,
            increaseCompute,
            args,
        )
    ) as Promise<TransactionSignature>;
}
