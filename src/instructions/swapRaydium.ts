import {
    AmmRpcData,
    AmmV4Keys,
    makeAMMSwapInstruction,
    Raydium,
    SwapInstructionParams
} from '@raydium-io/raydium-sdk-v2';
import {BN} from '@coral-xyz/anchor';
import {Connection, PublicKey, TransactionInstruction} from '@solana/web3.js';
import {getAssociatedTokenAddressSync} from '@solana/spl-token';
import {SwapMode} from './swap';

type RouteHop = {
    poolId: string;
    inputMint: string;
    outputMint: string;
    quotedInAmount: string;
    quotedOutAmount: string;
    priceImpactPct: number;
    poolKeys?: AmmV4Keys;
    poolRpcData?: AmmRpcData;
};

export type RouteQuoteResponse = {
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    priceImpactPct: number;
    route: RouteHop[];
    swapMode: SwapMode;
    slippageBps: number;
};

export type RaydiumInstructionResponse = {
    computeBudgetInstructions?: TransactionInstruction[];
    setupInstructions: TransactionInstruction[];
    swapInstructions: TransactionInstruction[];
    cleanupInstructions: TransactionInstruction[];
    addressLookupTableAddresses?: string[];
};

type PoolData = {
    poolInfo: any;
    poolKeys: AmmV4Keys;
    poolRpcData: AmmRpcData;
};

export async function getRaydiumRouteQuote(
    inputMint: PublicKey,
    outputMint: PublicKey,
    amount: number,
    slippageBps: number,
    poolIds: string[],
    swapMode: SwapMode = 'EXACT_IN',
    connection: Connection
): Promise<RouteQuoteResponse> {
    const raydium = await Raydium.load({
        owner: inputMint,
        connection,
        disableFeatureCheck: true,
        disableLoadToken: true, // TODO: investigate if we need
        blockhashCommitment: 'confirmed'
    });

    const poolDataPromises = poolIds.map(poolId =>
        raydium.liquidity.getPoolInfoFromRpc({ poolId })
    );
    const poolsData = await Promise.all(poolDataPromises);

    const poolDataMap = new Map<string, PoolData>();
    poolIds.forEach((poolId, index) => {
        poolDataMap.set(poolId, poolsData[index]);
    });

    let currentAmount = new BN(amount);
    const route: RouteHop[] = [];
    let totalPriceImpact = 0;

    if (swapMode === 'EXACT_OUT') {
        let currentOutputMint = outputMint;

        for (let i = poolIds.length - 1; i >= 0; i--) {
            const poolId = poolIds[i];
            const poolData = poolDataMap.get(poolId)!;
            const { poolInfo, poolKeys, poolRpcData } = poolData;

            const currentInputMint = i === 0
                ? inputMint
                : determineOutputMint(
                    new PublicKey(poolDataMap.get(poolIds[i - 1])!.poolKeys.mintA.address),
                    poolKeys
                );

            const computeResult = raydium.liquidity.computeAmountIn({
                poolInfo: {
                    ...poolInfo,
                    baseReserve: poolRpcData.baseReserve,
                    quoteReserve: poolRpcData.quoteReserve,
                    status: poolRpcData.status.toNumber(),
                    version: 4
                },
                amountOut: currentAmount,
                mintIn: currentInputMint,
                mintOut: currentOutputMint,
                slippage: slippageBps / 10000
            });

            const priceImpact = calculatePriceImpact(
                computeResult.amountIn.toString(),
                currentAmount.toString(),
                poolRpcData.baseReserve.toString(),
                poolRpcData.quoteReserve.toString()
            );

            route.unshift({
                poolId,
                inputMint: currentInputMint.toString(),
                outputMint: currentOutputMint.toString(),
                quotedInAmount: computeResult.maxAmountIn.toString(),
                quotedOutAmount: currentAmount.toString(),
                priceImpactPct: priceImpact,
                poolKeys,
                poolRpcData
            });

            currentAmount = computeResult.maxAmountIn;
            currentOutputMint = currentInputMint;
            totalPriceImpact += priceImpact;
        }

        return {
            inputMint: inputMint.toString(),
            outputMint: outputMint.toString(),
            inAmount: route[0].quotedInAmount,
            outAmount: amount.toString(),
            priceImpactPct: totalPriceImpact,
            route,
            swapMode,
            slippageBps
        };
    } else {
        let currentInputMint = inputMint;

        for (let i = 0; i < poolIds.length; i++) {
            const poolId = poolIds[i];
            const poolData = poolDataMap.get(poolId)!;
            const { poolInfo, poolKeys, poolRpcData } = poolData;

            const currentOutputMint = i === poolIds.length - 1
                ? outputMint
                : determineOutputMint(
                    currentInputMint,
                    poolDataMap.get(poolIds[i + 1])!.poolKeys
                );

            const computeResult = raydium.liquidity.computeAmountOut({
                poolInfo: {
                    ...poolInfo,
                    baseReserve: poolRpcData.baseReserve,
                    quoteReserve: poolRpcData.quoteReserve,
                    status: poolRpcData.status.toNumber(),
                    version: 4
                },
                amountIn: currentAmount,
                mintIn: currentInputMint,
                mintOut: currentOutputMint,
                slippage: slippageBps / 10000
            });

            const priceImpact = calculatePriceImpact(
                currentAmount.toString(),
                computeResult.amountOut.toString(),
                poolRpcData.baseReserve.toString(),
                poolRpcData.quoteReserve.toString()
            );

            route.push({
                poolId,
                inputMint: currentInputMint.toString(),
                outputMint: currentOutputMint.toString(),
                quotedInAmount: currentAmount.toString(),
                quotedOutAmount: computeResult.amountOut.toString(),
                priceImpactPct: priceImpact,
                poolKeys,
                poolRpcData
            });

            currentAmount = computeResult.amountOut;
            currentInputMint = currentOutputMint;
            totalPriceImpact += priceImpact;
        }

        return {
            inputMint: inputMint.toString(),
            outputMint: outputMint.toString(),
            inAmount: amount.toString(),
            outAmount: route[route.length - 1].quotedOutAmount,
            priceImpactPct: totalPriceImpact,
            route,
            swapMode,
            slippageBps
        };
    }
}

function determineOutputMint(
    currentInputMint: PublicKey,
    nextPoolKeys: AmmV4Keys
): PublicKey {
    const mintA = new PublicKey(nextPoolKeys.mintA.address);
    return currentInputMint.equals(mintA)
        ? new PublicKey(nextPoolKeys.mintB.address)
        : mintA;
}

export async function createRaydiumRouteSwapInstructions({
    quoteResponse,
    ownerPubkey,
    authorityPubkey,
}: {
    quoteResponse: RouteQuoteResponse;
    ownerPubkey: PublicKey;
    authorityPubkey?: PublicKey;
}): Promise<RaydiumInstructionResponse> {
    const swapInstructions: TransactionInstruction[] = [];

    for (let i = 0; i < quoteResponse.route.length; i++) {
        const hop = quoteResponse.route[i];

        if (!hop.poolKeys || !hop.poolRpcData) {
            throw new Error(`Hop ${i} missing required pool information`);
        }

        const inputMint = new PublicKey(hop.inputMint);
        const outputMint = new PublicKey(hop.outputMint);

        const tokenAccountIn = getAssociatedTokenAddressSync(inputMint, ownerPubkey, true);
        const tokenAccountOut = getAssociatedTokenAddressSync(outputMint, ownerPubkey, true);

        const instructionParams: SwapInstructionParams = {
            version: 4,
            poolKeys: hop.poolKeys,
            userKeys: {
                tokenAccountIn,
                tokenAccountOut,
                owner: authorityPubkey ? authorityPubkey : ownerPubkey
            },
            amountIn: new BN(hop.quotedInAmount),
            amountOut: new BN(hop.quotedOutAmount),
            fixedSide: quoteResponse.swapMode === 'EXACT_IN' ? 'in' : 'out'
        };

        const swapInstruction = makeAMMSwapInstruction(instructionParams);
        swapInstructions.push(swapInstruction);
    }

    return {
        setupInstructions: [],
        swapInstructions,
        cleanupInstructions: []
    };
}

export function calculatePriceImpact(
    amountIn: string | number,
    amountOut: string | number,
    reserveIn: string | number,
    reserveOut: string | number
): number {
    const in_bn = new BN(amountIn.toString()).toNumber() / 10 ** 6;
    const out_bn = new BN(amountOut.toString()).toNumber() / 10 ** 6;
    const reserveIn_bn = new BN(reserveIn.toString()).toNumber() / 10 ** 6;
    const reserveOut_bn = new BN(reserveOut.toString()).toNumber() / 10 ** 6;

    const priceBefore = reserveOut_bn / reserveIn_bn;
    const priceAfter = (reserveOut_bn - out_bn) / (reserveIn_bn + in_bn);

    return (priceBefore - priceAfter) * 100 / priceBefore;
}
