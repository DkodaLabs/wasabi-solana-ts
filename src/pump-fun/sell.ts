import {
    AccountMeta,
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getDiscriminator } from '../utils';
import {
    getBondingCurve,
    getEventAuthority,
    PUMP_FUN_GLOBAL_ACCOUNT,
    PUMP_FUN_PROGRAM_ID
} from './utils';

export type SellTokenArgs = {
    amount: bigint;
    minSolOutput: bigint;
};

export type SellTokenAccounts = {
    user: PublicKey;
    mint: PublicKey;
    feeRecipient: PublicKey;
};

export const createPumpFunSellTokenInstruction = async (
    args: SellTokenArgs,
    accounts: SellTokenAccounts
): Promise<TransactionInstruction> => {
    const bondingCurve = getBondingCurve(accounts.mint);
    const associatedBondingCurve = getAssociatedTokenAddressSync(
        bondingCurve,
        accounts.mint,
        true,
        TOKEN_PROGRAM_ID
    );
    const associatedUser = getAssociatedTokenAddressSync(
        accounts.mint,
        accounts.user,
        true,
        TOKEN_PROGRAM_ID
    );
    const keys: AccountMeta[] = [
        { pubkey: PUMP_FUN_GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
        { pubkey: accounts.feeRecipient, isSigner: false, isWritable: true },
        { pubkey: accounts.mint, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
        { pubkey: associatedUser, isSigner: false, isWritable: true },
        { pubkey: accounts.user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: getEventAuthority(), isSigner: false, isWritable: false },
        { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];

    const discriminator = getDiscriminator('global', 'sell');
    const amountBuffer = Buffer.alloc(8);
    const minSolOutputBuffer = Buffer.alloc(8);
    amountBuffer.writeBigInt64LE(args.amount);
    minSolOutputBuffer.writeBigInt64LE(args.minSolOutput);

    const data = Buffer.concat([discriminator, amountBuffer, minSolOutputBuffer]);

    return new TransactionInstruction({
        keys,
        data,
        programId: PUMP_FUN_PROGRAM_ID
    });
};