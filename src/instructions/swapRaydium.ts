import {
    Raydium,
    AmmV4Keys,
    AmmRpcData,
    makeAMMSwapInstruction,
    SwapInstructionParams
} from '@raydium-io/raydium-sdk-v2';
import { BN } from '@coral-xyz/anchor';
import { TransactionInstruction, PublicKey, Connection } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { SwapMode } from './swap';


type MarketInfo = {
    id: string;
    inputMint: string;
    outputMint: string;
    notEnoughLiquidity: boolean;
    inAmount: string;
    outAmount: string;
    lpFee: {
        amount: string;
        mint: string;
        pct: number;
    };
    priceImpactPct: number;
};

type QuoteResponse = {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    amount: string;
    priceImpactPct: number;
    marketInfo: MarketInfo;
    swapMode: SwapMode;
    slippageBps: number;
    poolKeys?: AmmV4Keys;
    poolRpcData?: AmmRpcData;
};

type RaydiumInstructionResponse = {
    computeBudgetInstructions?: TransactionInstruction[];
    setupInstructions: TransactionInstruction[];
    swapInstruction: TransactionInstruction;
    cleanupInstructions: TransactionInstruction[];
    addressLookupTableAddresses?: string[];
};

type CreateSwapInstructionArgs = {
    quoteResponse: QuoteResponse;
    userPublicKey: PublicKey;
};

export async function getRaydiumQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: number,
    slippageBps: number,
    poolId: string,
    swapMode: SwapMode = 'ExactIn',
    connection: Connection
): Promise<QuoteResponse> {
    const raydium = await Raydium.load({
        owner: inputMint, // Temporary placeholder, not used for quote
        connection,
        disableFeatureCheck: true,
        disableLoadToken: false,
        blockhashCommitment: 'confirmed'
    });

    const poolData = await raydium.liquidity.getPoolInfoFromRpc({
        poolId
    });

    const { poolInfo, poolKeys, poolRpcData } = poolData;

    const computeResult = raydium.liquidity.computeAmountOut({
        poolInfo: {
            ...poolInfo,
            baseReserve: poolRpcData.baseReserve,
            quoteReserve: poolRpcData.quoteReserve,
            status: poolRpcData.status.toNumber(),
            version: 4
        },
        amountIn: new BN(amount),
        mintIn: inputMint,
        mintOut: outputMint,
        slippage: slippageBps / 10000
    });

    const priceImpactPct = calculatePriceImpact(
        amount,
        computeResult.amountOut.toString(),
        poolRpcData.baseReserve.toString(),
        poolRpcData.quoteReserve.toString()
    );

    return {
        inputMint: inputMint.toString(),
        outputMint: outputMint.toString(),
        inAmount: amount.toString(),
        outAmount: computeResult.amountOut.toString(),
        amount: amount.toString(),
        priceImpactPct,
        marketInfo: {
            id: poolId,
            inputMint: inputMint.toString(),
            outputMint: outputMint.toString(),
            notEnoughLiquidity: computeResult.amountOut.isZero(),
            inAmount: amount.toString(),
            outAmount: computeResult.amountOut.toString(),
            lpFee: {
                amount: computeResult.fee?.toString() || '0',
                mint: inputMint.toString(),
                pct: 0.3
            },
            priceImpactPct
        },
        swapMode,
        slippageBps,
        poolKeys,
        poolRpcData
    };
}

export async function createRaydiumSwapInstructions({
    quoteResponse,
    userPublicKey
}: CreateSwapInstructionArgs): Promise<RaydiumInstructionResponse> {
    if (!quoteResponse.poolKeys || !quoteResponse.poolRpcData) {
        throw new Error('Quote response missing required pool information');
    }

    const inputMint = new PublicKey(quoteResponse.inputMint);
    const outputMint = new PublicKey(quoteResponse.outputMint);

    const tokenAccountIn = getAssociatedTokenAddressSync(inputMint, userPublicKey, true);

    const tokenAccountOut = getAssociatedTokenAddressSync(outputMint, userPublicKey, true);

    const instructionParams: SwapInstructionParams = {
        version: 4,
        poolKeys: quoteResponse.poolKeys,
        userKeys: {
            tokenAccountIn,
            tokenAccountOut,
            owner: userPublicKey
        },
        amountIn: new BN(quoteResponse.inAmount),
        amountOut: new BN(quoteResponse.outAmount),
        fixedSide: quoteResponse.swapMode === 'ExactIn' ? 'in' : 'out'
    };

    const swapInstruction = makeAMMSwapInstruction(instructionParams);

    return {
        setupInstructions: [],
        swapInstruction,
        cleanupInstructions: []
    };
}

function calculatePriceImpact(
    amountIn: string | number,
    amountOut: string | number,
    reserveIn: string | number,
    reserveOut: string | number
): number {
    const in_bn = new BN(amountIn.toString());
    const out_bn = new BN(amountOut.toString());
    const reserveIn_bn = new BN(reserveIn.toString());
    const reserveOut_bn = new BN(reserveOut.toString());

    const priceBefore = reserveOut_bn.mul(new BN(1000000)).div(reserveIn_bn);
    const priceAfter = reserveOut_bn.sub(out_bn).mul(new BN(1000000)).div(reserveIn_bn.add(in_bn));

    const priceImpact = priceBefore
        .sub(priceAfter)
        .mul(new BN(100))
        .mul(new BN(1000000))
        .div(priceBefore);

    return parseFloat(priceImpact.toString()) / 1000000;
}
