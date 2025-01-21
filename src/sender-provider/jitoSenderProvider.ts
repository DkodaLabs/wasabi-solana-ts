import {searcher} from 'jito-ts';
import {
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction
} from '@solana/web3.js';
import {Bundle} from 'jito-ts/dist/sdk/block-engine/types';
import {AbstractSenderProvider, SenderProviderOptions, TransactionSigner} from './index';

export class JitoSenderProvider extends AbstractSenderProvider {
  private searcherClient?: searcher.SearcherClient;
  private tipAmount: bigint = 1000n;
  private transactionLimit?: number = 5;
  private JITO_DEFAULT_RPC_URL = 'https://mainnet.block-engine.jito.wtf/api/v1';

  constructor(options: SenderProviderOptions) {
    super(options);
    this.searcherClient = options.provider.searcherClient || searcher.searcherClient(this.JITO_DEFAULT_RPC_URL);
    this.tipAmount = options.provider.tipAmount;
  }

  // A tip transaction is ~212 bytes
  async createTipTransaction(payer: PublicKey): Promise<VersionedTransaction> {
    const [{blockhash}, tipIx] = await Promise.all([
      this.connection.getLatestBlockhash(),
      this.createTipInstruction(payer)
    ]);

    const messageV0 = new TransactionMessage({
      payerKey: payer,
      recentBlockhash: blockhash,
      instructions: [tipIx]
    }).compileToV0Message();

    return new VersionedTransaction(messageV0);
  }

  // A tip instruction is ~108 bytes
  async createTipInstruction(payer: PublicKey): Promise<TransactionInstruction> {
    const tipAccounts = await this.searcherClient
      .getTipAccounts()
      .then((res) =>
        res.ok ? res.value : Promise.reject('Failed to retrieve tip accounts')
      );
    const tipAccount = new PublicKey(
      tipAccounts[Math.floor(Math.random() * tipAccounts.length)]
    );

    return SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: tipAccount,
      lamports: this.tipAmount
    });
  }

  // Returns lamports NOT micro-lamports
  private getTipAmountFromPriorityFee(transaction: VersionedTransaction): bigint {
    const instructions = transaction.message.compiledInstructions;
    const computeLimit = new DataView(instructions[0].data.buffer).getUint32(1, true);
    const computePrice = new DataView(instructions[1].data.buffer).getBigUint64(1, true);
    return (BigInt(computeLimit) * computePrice) / BigInt(1000);
  }

  //private async getTipAmountFromRpc(): bigint {
  //
  //}

  private async sendTx(transaction: VersionedTransaction): Promise<string> {
    return await this.connection.sendTransaction(transaction, {skipPreflight: true});
  }

  private async sendBundle(transactions: Array<VersionedTransaction>): Promise<string> {
    try {
      let isLeaderSlot = false;
      while (!isLeaderSlot) {
        const nextLeader = await this.searcherClient.getNextScheduledLeader();
        if (!nextLeader.ok) {
          throw new Error('Failed to get next leader');
        }

        const numSlots = nextLeader.value.nextLeaderSlot - nextLeader.value.currentSlot;
        isLeaderSlot = numSlots <= 2;
        await new Promise(r => setTimeout(r, 500));
      }

      const bundle = new Bundle(transactions, this.transactionLimit);

      const result = await this.searcherClient.sendBundle(bundle);
      if (!result.ok) {
        throw new Error('Failed to send bundle');
      }

      return result.value;
    } catch (e) {
      throw e;
    }
  }

  async prepare(transactions: Array<VersionedTransaction>, payer: PublicKey, signer: TransactionSigner): Promise<Array<VersionedTransaction>> {
    const tipTx = await this.createTipTransaction(payer);
    transactions.push(tipTx);

    if (this.isSimulation) {
      await this.simulate(transactions);
    }

    transactions.forEach(tx => this.sign(tx, signer));

    return transactions;
  }

  async send(transactions: Array<VersionedTransaction>): Promise<string> {
    try {
      if (transactions.length > 1) {
        return await this.sendBundle(transactions)
      }

      return await this.sendTx(transactions[0]);
    } catch {
      throw new Error('Failed to send transaction(s)');
    }
  }
}
