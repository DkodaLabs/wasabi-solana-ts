import { PublicKey } from '@solana/web3.js';


export type OpenLongPositionInstructionAccounts = {
    owner: PublicKey;
    ownerCurrencyAccount: PublicKey;
    lpVault: PublicKey;
    vault: PublicKey;
    pool: PublicKey;
    currencyVault: PublicKey;
    collateralVault: PublicKey;
    currency: PublicKey;
    collateral: PublicKey;
    position: PublicKey;
    authority: PublicKey;
    permission: PublicKey;
    feeWallet: PublicKey;
    debtController: PublicKey;
    globalSettings: PublicKey;
    tokenProgram: PublicKey;
    systemProgram: PublicKey;
};