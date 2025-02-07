import {
    AccountMeta,
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { getDiscriminator } from '../utils';
import {
    getBondingCurve,
    getEventAuthority,
    PUMP_FUN_GLOBAL_ACCOUNT,
    PUMP_FUN_PROGRAM_ID
} from './utils';

export type WithdrawTokenArgs = {
    name: string;
    symbol: string;
    uri: string;
};
export type WithdrawTokenAccounts = {
    user: PublicKey;
    mint: PublicKey;
};

export const createPumpFunWithdrawTokenInstruction = async (
    args: WithdrawTokenArgs,
    accounts: WithdrawTokenAccounts
): Promise<TransactionInstruction> => {
    const bondingCurve = getBondingCurve(accounts.mint);
    const associatedBondingCurve = getAssociatedTokenAddressSync(
        accounts.mint,
        bondingCurve,
        true,
        TOKEN_PROGRAM_ID
    );
    const associatedUser = getAssociatedTokenAddressSync(
        accounts.mint,
        accounts.user,
        false,
        TOKEN_PROGRAM_ID
    );

    const keys: AccountMeta[] = [
        { pubkey: PUMP_FUN_GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
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

    const discriminator = getDiscriminator('global', 'withdraw');

    return new TransactionInstruction({
        keys,
        data: discriminator,
        programId: PUMP_FUN_PROGRAM_ID
    });
};
