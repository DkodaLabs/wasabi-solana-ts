import { PublicKey, TransactionInstruction, AccountMeta } from '@solana/web3.js';

export type JsonAccountMeta = {
  pubkey: string;
  isSigner: boolean;
  isWritable: boolean;
};

export type JsonTransactionInstruction = {
  // Jupiter returns accounts instead of keys value
  accounts?: JsonAccountMeta[];
  keys?: JsonAccountMeta[];
  programId: string;
  data: string;
}

const mapJsonAccountMeta = (account: JsonAccountMeta): AccountMeta => {
  return {
    pubkey: new PublicKey(account.pubkey),
    isSigner: account.isSigner,
    isWritable: account.isWritable
  };
}

export const mapJsonIx = (jsonTxIx: JsonTransactionInstruction): TransactionInstruction => {
  if (jsonTxIx.accounts === undefined && jsonTxIx.keys === undefined) {
    throw new Error('Invalid transaction instruction: missing accounts or keys');
  }
  return new TransactionInstruction({
    keys: jsonTxIx.accounts?.map(mapJsonAccountMeta) || jsonTxIx.keys?.map(mapJsonAccountMeta) || [],
    programId: new PublicKey(jsonTxIx.programId),
    data: Buffer.from(jsonTxIx.data),
  });
}

export const mapJsonIxBase64 = (jsonTxIx: JsonTransactionInstruction): TransactionInstruction => {
  if (jsonTxIx.accounts === undefined && jsonTxIx.keys === undefined) {
    throw new Error('Invalid transaction instruction: missing accounts or keys');
  }
  return new TransactionInstruction({
    keys: jsonTxIx.accounts?.map(mapJsonAccountMeta) || jsonTxIx.keys?.map(mapJsonAccountMeta) || [],
    programId: new PublicKey(jsonTxIx.programId),
    data: Buffer.from(jsonTxIx.data, 'base64'),
  });
}
