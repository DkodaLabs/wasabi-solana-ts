import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { AbstractSenderProvider, SenderProviderOptions, TransactionSigner } from './index';

export class AgaveSenderProvider extends AbstractSenderProvider {
    constructor(options: SenderProviderOptions) {
        super(options);
    }
    
    async prepare(transactions: Array<VersionedTransaction>, payer: PublicKey, signer: TransactionSigner): Promise<Array<VersionedTransaction>> {
        if (transactions.length > 1) {
            throw new Error('Agave does not support sending multiple transactions');
        }
        
        if (this.isSimulation) {
            await this.simulate(transactions);
        }
        
        return [await this.sign(transactions[0], signer)];
    }

    async send(transactions: Array<VersionedTransaction>): Promise<string> {
        return await this.connection.sendTransaction(transactions[0], { skipPreflight: true });
    }
}
