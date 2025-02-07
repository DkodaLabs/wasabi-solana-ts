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

export type BuyTokenArgs = {
    amount: bigint;
    maxSolCost: bigint;
};

export type BuyTokenAccounts = {
    user: PublicKey;
    mint: PublicKey;
    feeRecipient: PublicKey;
};

export const createPumpFunBuyTokenInstruction = async (
    args: BuyTokenArgs,
    accounts: BuyTokenAccounts
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

    const discriminator = getDiscriminator('global', 'buy');
    const amountBuffer = Buffer.alloc(8);
    const maxSolCostBuffer = Buffer.alloc(8);
    amountBuffer.writeBigInt64LE(args.amount);
    maxSolCostBuffer.writeBigInt64LE(args.maxSolCost);

    const data = Buffer.concat([discriminator, amountBuffer, maxSolCostBuffer]);

    return new TransactionInstruction({
        keys,
        data,
        programId: PUMP_FUN_PROGRAM_ID
    });
};
