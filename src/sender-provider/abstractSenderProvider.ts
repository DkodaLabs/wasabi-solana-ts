import {Connection, VersionedTransaction, Keypair, PublicKey} from '@solana/web3.js';
import {searcher} from 'jito-ts';

export interface SenderProviderOptions {
  connection: Connection;
  isSimulation?: boolean;
  isConfirmation?: boolean;
  provider?: {
    searcherClient?: searcher.SearcherClient;
    tipAmount?: bigint;
    transactionLimit?: number;
  };
}

export type TransactionSigner = {
  signTransaction?: (transaction: VersionedTransaction) => Promise<VersionedTransaction>;
} | Keypair;

export abstract class AbstractSenderProvider {
  protected connection: Connection;
  protected isSimulation: boolean;
  protected isConfirmation: boolean;

  protected constructor(options: SenderProviderOptions) {
    this.connection = options.connection;
    this.isSimulation = options.isSimulation ?? false;
    this.isConfirmation = options.isConfirmation ?? false;
  }

  //validateSignatures(transactions: Array<VersionedTransaction>, walletPubkey: PublicKey): void {
  //    for (const tx of transactions) {
  //        if (!tx.signatures.length) {
  //            throw new Error('Transaction has no signatures');
  //        }
  //
  //        const serializedBuffer = Buffer.from(tx, 'base64');
  //        const transaction = VersionedTransaction.deserialize(serializedBuffer);
  //
  //        const message = transaction.message;
  //        const feePayerPubkey = message.staticAccountKeys[0];
  //        if (!feePayerPubkey.equals(walletPubkey)) {
  //            throw new Error('Fee payer public key mismatch');
  //        }
  //    }
  //
  //    return;
  //}

  protected async simulate(transactions: Array<VersionedTransaction>): Promise<void> {
    const simPromises = transactions.map((tx) => {
      return this.connection.simulateTransaction(tx, {commitment: 'confirmed'});
    });
    const simResults = await Promise.all([...simPromises]);

    for (const simResult of simResults) {
      if (simResult.value.err) {
        throw new Error(
          'Failed to simulate transaction: ' + simResult.value.err.toString() + ''
        );
      }
    }

    return;
  }

  protected async confirmTransaction(signature: string): Promise<void> {
    const {blockhash, lastValidBlockHeight} = await this.connection.getLatestBlockhash();
    const confirmation = await this.connection.confirmTransaction(
      {
        signature,
        blockhash,
        lastValidBlockHeight,
      },
      'confirmed'
    );

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    return;
  }

  async sign(transaction: VersionedTransaction, signer: TransactionSigner): Promise<VersionedTransaction> {
    if ('signTransaction' in signer && signer.signTransaction) {
      return signer.signTransaction(transaction);
    } else if (signer instanceof Keypair) {
      transaction.sign([signer]);
      return (await transaction);
    }

    throw new Error('Invalid signer');
  }

  abstract prepare(transactions: Array<VersionedTransaction>, payer: PublicKey, signer: TransactionSigner): Promise<Array<VersionedTransaction>>;

  abstract send(transactions: Array<VersionedTransaction>): Promise<string>;
}
