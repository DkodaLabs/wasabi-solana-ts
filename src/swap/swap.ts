import { Program } from '@coral-xyz/anchor';
import {
  TransactionInstruction,
  VersionedTransaction,
  PublicKey,
  Connection,
  AddressLookupTableAccount,
  TransactionMessage,
} from '@solana/web3.js';
import {
  createJupiterSwapInstructions,
  getJupiterQuote,
  createJupiterDirectSwap
} from './swapJupiter';
import { createDepositInstruction, createWithdrawInstruction } from '../instructions';
import { WasabiSolana } from '../idl/wasabi_solana';
import { Level } from '../base';
import { SOL_MINT } from '../utils';

export type SwapType = 'SWAP' | 'SWAP_INTO' | 'SWAP_OUT' | 'SWAP_BETWEEN';
export type SwapMode = 'EXACT_IN' | 'EXACT_OUT';
export type SwapProvider = 'jupiter' | 'raydium';

export type SwapInstructionGroup = {
  setupInstructions: TransactionInstruction[];
  swapInstruction: TransactionInstruction;
  cleanupInstruction: TransactionInstruction;
  addressLookupTableAddresses?: string[];
};

export async function swap(
  inputMint: PublicKey,
  outputMint: PublicKey,
  amount: number,
  slippageBps: number,
  userPublicKey: PublicKey,
  swapMode: SwapMode,
  swapType: SwapType,
  program?: Program<WasabiSolana>,
  feeLevel?: Level,
): Promise<VersionedTransaction> {
  switch (swapType) {
    case 'SWAP':
      return await createJupiterDirectSwap(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        swapMode,
        userPublicKey
      );
    case 'SWAP_INTO':
      return createSwapIntoTransaction(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        userPublicKey,
        swapMode,
        program,
        feeLevel,
      );
    case 'SWAP_OUT':
      return createSwapOutTransaction(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        userPublicKey,
        swapMode,
        program,
        feeLevel,
      );
    case 'SWAP_BETWEEN':
      return createSwapBetweenTransaction(
        inputMint,
        outputMint,
        amount,
        slippageBps,
        userPublicKey,
        swapMode,
        program,
        feeLevel,
      );
    default:
      throw new Error('Invalid swap');
  }
}

export async function createSwapIntoTransaction(
  inputMint: PublicKey,
  outputMint: PublicKey, // The mint of the token we are depositing into the vault
  amount: number,
  slippageBps: number,
  userPublicKey: PublicKey,
  swapMode: SwapMode,
  program: Program<WasabiSolana>,
  feeLevel: Level,
): Promise<VersionedTransaction> {
  const quoteResponse = await getJupiterQuote(
    inputMint,
    outputMint,
    amount,
    slippageBps,
    swapMode
  );

  const [swapIxes, depositIxes] = await Promise.all([
    createJupiterSwapInstructions({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: outputMint.equals(SOL_MINT) ? true : false
    }),
    createDepositInstruction(
      program,
      { amount: Number(quoteResponse.outAmount) },
      { assetMint: outputMint },
      feeLevel,
    ),
  ]);

  const ixes = [];

  // Compute budget ixes
  ixes.push(depositIxes[0], depositIxes[1]);

  // If the output mint will equal SOL then we don't want to unwrap the wSOL from the swap
  if (outputMint.equals(SOL_MINT)) {
    ixes.push(
      ...swapIxes.setupInstructions,
      swapIxes.swapInstruction,
      // But we want the close ATA from `createDepositInstruction`
      depositIxes[5],
      depositIxes[6]
    );
  } else {
    // Otherwise we just need the swap instruction and deposit instructions
    ixes.push(swapIxes.swapInstruction, ...depositIxes.slice(2));
  }

  return createVersionedTransaction(
    userPublicKey,
    ixes,
    program.provider.connection,
    swapIxes.addressLookupTableAddresses
  );
}

export async function createSwapBetweenTransaction(
  inputMint: PublicKey, // The mint of the token we are withdrawing from the vault
  outputMint: PublicKey, // The mint of the token we are depositing into the vault
  amount: number,
  slippageBps: number,
  userPublicKey: PublicKey,
  swapMode: SwapMode,
  program: Program<WasabiSolana>,
  feeLevel: Level,
): Promise<VersionedTransaction> {
  const quoteResponse = await getJupiterQuote(
    inputMint,
    outputMint,
    amount,
    slippageBps,
    swapMode,
  );

  const [withdrawIxes, swapIxes, depositIxes] = await Promise.all([
    createWithdrawInstruction(program, { amount }, { assetMint: inputMint }, feeLevel),
    createJupiterSwapInstructions({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: outputMint.equals(SOL_MINT) || inputMint.equals(SOL_MINT) ? true : false
    }),
    createDepositInstruction(
      program,
      { amount: Number(quoteResponse.outAmount) },
      { assetMint: outputMint },
      feeLevel,
    )
  ]);

  const ixes = [];

  // Compute budget ixes
  ixes.push(withdrawIxes[0], withdrawIxes[1]);

  if (inputMint.equals(SOL_MINT)) {
    ixes.push(
      // when the mint is SOL we need to create the ATA and then withdraw into it
      // but we don't need to sync
      withdrawIxes[2], // create ATA
      withdrawIxes[3], // withdraw
      swapIxes.swapInstruction,
      swapIxes.cleanupInstruction, // should be the close
    )
  } else {
    ixes.push(
      ...withdrawIxes.slice(2), // withdraw
      // we need the setupInstructions in case the output mint is SOL
      ...(swapIxes.setupInstructions || []), // i.e. create ATA / transfer & sync
      swapIxes.swapInstruction,
    );
  }

  // Deposit might include generation of the user's vault ata
  if (outputMint.equals(SOL_MINT)) {
    // get the deposit and close
    ixes.push(...depositIxes.slice(5));
  } else {
    // just the deposit
    ixes.push(depositIxes[2]); // just the deposit ix
  }

  return createVersionedTransaction(
    userPublicKey,
    ixes,
    program.provider.connection,
    swapIxes.addressLookupTableAddresses
  );
}

async function createSwapOutTransaction(
  inputMint: PublicKey, // The mint of the token we are withdrawing from the vault
  outputMint: PublicKey, // The mint of the token the user wants to swap to
  amount: number,
  slippageBps: number,
  userPublicKey: PublicKey,
  swapMode: SwapMode,
  program: Program<WasabiSolana>,
  feeLevel: Level,
): Promise<VersionedTransaction> {
  const quoteResponse = await getJupiterQuote(
    inputMint,
    outputMint,
    amount,
    slippageBps,
    swapMode,
  );

  const [withdrawIxes, swapIxes] = await Promise.all([
    createWithdrawInstruction(
      program,
      { amount },
      { assetMint: inputMint },
      feeLevel,
    ),
    createJupiterSwapInstructions({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: outputMint.equals(SOL_MINT) ? true : false,
    }),
  ]);

  const ixes = [];

  // Compute budget ixes
  ixes.push(withdrawIxes[0], withdrawIxes[1]);
  if (inputMint.equals(SOL_MINT)) {
    ixes.push(
      withdrawIxes[2], // ATA
      withdrawIxes[3], // Withdraw 
      swapIxes.swapInstruction,
      swapIxes.cleanupInstruction, // Close ATA
    );
  } else {
    // we don't need to handle the case of SOL being the output since
    // the returned jupiter instructions will handle that
    ixes.push(
      withdrawIxes[2], // withdraw
      ...(swapIxes.setupInstructions || []), // ATA if needed
      swapIxes.swapInstruction,
      swapIxes.cleanupInstruction, // close ATA
    );
  }

  return createVersionedTransaction(
    userPublicKey,
    ixes,
    program.provider.connection,
    swapIxes.addressLookupTableAddresses
  );
}

async function createVersionedTransaction(
  userPubkey: PublicKey,
  instructions: TransactionInstruction[],
  connection: Connection,
  lookupTableAccounts?: string[],
): Promise<VersionedTransaction> {
  const { blockhash } = await connection.getLatestBlockhash();

  let lookupTables;
  if (lookupTableAccounts) {
    lookupTables = await getAddressLookupTableAccounts([
      ...lookupTableAccounts
    ], connection);
  }

  const messageV0 = new TransactionMessage({
    payerKey: userPubkey,
    recentBlockhash: blockhash,
    instructions
  }).compileToV0Message(lookupTables);

  return new VersionedTransaction(messageV0);
}

async function getAddressLookupTableAccounts(
  addresses: string[],
  connection: Connection,
): Promise<AddressLookupTableAccount[]> {
  return Promise.all(
    addresses.map(async (address) => {
      const account = await connection
        .getAddressLookupTable(new PublicKey(address))
        .then((res) => res.value);

      if (!account) {
        throw new Error(`Lookup table ${address} not found`);
      }
      return account;
    })
  );
}

