// 30% of the total priority fee - intended to be used in addition to the priority fee for the `/transaction`
// endpoint
export const getTipAmountFromPriorityFee = (transaction: VersionedTransaction): number => {
  const instructions = transaction.message.compiledInstructions;
  const computeLimit = new DataView(instructions[0].data.buffer).getUint32(1, true);
  const computePrice = new DataView(instructions[1].data.buffer).getBigUint64(1, true);
  return Number((BigInt(computeLimit) * computePrice) / BigInt(3000000));
};

export const getTipAmountFromRpc = async (): Promise<LatestTips> => {
  const client = axios.create({
    headers: {
      'Content-Type': 'application/json'
    }
  });

  const response = await client.get('https://bundles.jito.wtf/api/v1/bundles/tip_floor');
  return response.data;
};

