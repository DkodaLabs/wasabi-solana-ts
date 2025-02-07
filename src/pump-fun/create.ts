import {
    AccountMeta,
    Keypair,
    PublicKey,
    TransactionInstruction,
    SystemProgram,
    SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import {
    getAssociatedTokenAddressSync,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { MPL_TOKEN_METADATA_PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { getDiscriminator } from '../utils';
import { getBondingCurve, getEventAuthority, PUMP_FUN_PROGRAM_ID } from './utils';

export type CreateTokenArgs = {
    name: string;
    symbol: string;
    uri: string;
};
export type CreateTokenAccounts = {
    user: PublicKey;
};

export const createPumpFunCreateTokenInstruction = async (
    args: CreateTokenArgs,
    accounts: CreateTokenAccounts
): Promise<TransactionInstruction> => {
    const mintKeypair = Keypair.generate();
    const bondingCurve = getBondingCurve(mintKeypair.publicKey);
    const associatedBondingCurve = getAssociatedTokenAddressSync(
        bondingCurve,
        mintKeypair.publicKey,
        true,
        TOKEN_PROGRAM_ID
    );
    const metadata = PublicKey.findProgramAddressSync(
        [
            Buffer.from('metadata'),
            new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID).toBuffer(),
            mintKeypair.publicKey.toBuffer()
        ],
        new PublicKey(MPL_TOKEN_METADATA_PROGRAM_ID)
    )[0];

    const keys: AccountMeta[] = [
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: accounts.user, isSigner: false, isWritable: false },
        { pubkey: bondingCurve, isSigner: false, isWritable: true },
        { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
        { pubkey: metadata, isSigner: false, isWritable: true },
        { pubkey: accounts.user, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: getEventAuthority(), isSigner: false, isWritable: false },
        { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false }
    ];

    const discriminator = getDiscriminator('global', 'create');
    const nameBuffer = Buffer.from(args.name, 'utf-8');
    const symbolBuffer = Buffer.from(args.symbol, 'utf-8');
    const uriBuffer = Buffer.from(args.uri, 'utf-8');

    const data = Buffer.concat([discriminator, nameBuffer, symbolBuffer, uriBuffer]);

    return new TransactionInstruction({
        keys,
        data,
        programId: PUMP_FUN_PROGRAM_ID
    });
};
