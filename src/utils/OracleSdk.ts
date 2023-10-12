
export interface Proof {
	readonly block: Uint8Array
	readonly accountProofNodesRlp: Uint8Array
	readonly reserveAndTimestampProofNodesRlp: Uint8Array
	readonly priceAccumulatorProofNodesRlp: Uint8Array
}

export type ProofResult = {
	readonly accountProof: readonly Uint8Array[]
	readonly storageProof: readonly {
		readonly key: bigint
		readonly value: bigint
		readonly proof: readonly Uint8Array[]
	}[]
}

export type Block = {
	readonly parentHash: bigint
	readonly sha3Uncles: bigint
	readonly miner: bigint
	readonly stateRoot: bigint
	readonly transactionsRoot: bigint
	readonly receiptsRoot: bigint
	readonly logsBloom: bigint
	readonly difficulty: bigint
	readonly number: bigint
	readonly gasLimit: bigint
	readonly gasUsed: bigint
	readonly timestamp: bigint
	readonly extraData: Uint8Array
	readonly mixHash: bigint | undefined
	readonly nonce: bigint | null
    readonly baseFeePerGas: bigint | null
}

export type EthGetStorageAt = (address: bigint, position: bigint, block: bigint | 'latest') => Promise<bigint>
export type EthGetProof = (address: bigint, positions: readonly bigint[], block: bigint) => Promise<ProofResult>
export type EthGetBlockByNumber = (blockNumber: bigint | 'latest') => Promise<Block | null>

export function addressToString(value: bigint) {
	return `0x${value.toString(16).padStart(40, '0')}`
}

export async function getPrice(eth_getStorageAt: EthGetStorageAt, eth_getBlockByNumber: EthGetBlockByNumber, exchangeAddress: bigint, quoteTokenIndex: number, blockNumber: bigint): Promise<bigint> {
	async function getAccumulatorValue(innerBlockNumber: bigint, timestamp: bigint) {
	  const [reservesAndTimestamp, accumulator0, accumulator1] = await Promise.all([
		eth_getStorageAt(exchangeAddress, 8n, innerBlockNumber),
		eth_getStorageAt(exchangeAddress, 9n, innerBlockNumber),
		eth_getStorageAt(exchangeAddress, 10n, innerBlockNumber)
	  ])
  
	  const blockTimestampLast = reservesAndTimestamp >> (112n + 112n)
	  const reserve1 = (reservesAndTimestamp >> 112n) & (2n ** 112n - 1n)
	  const reserve0 = reservesAndTimestamp & (2n ** 112n - 1n)
	  // if (token0 !== denominationToken && token1 !== denominationToken) throw new Error(`Denomination token ${addressToString(denominationToken)} is not one of the tokens for exchange ${exchangeAddress}`)
	  if (reserve0 === 0n) throw new Error(`Exchange ${addressToString(exchangeAddress)} does not have any reserves for token0.`)
	  if (reserve1 === 0n) throw new Error(`Exchange ${addressToString(exchangeAddress)} does not have any reserves for token1.`)
	  if (blockTimestampLast === 0n) throw new Error(`Exchange ${addressToString(exchangeAddress)} has not had its first accumulator update (or it is year 2106).`)
	  if (accumulator0 === 0n) throw new Error(`Exchange ${addressToString(exchangeAddress)} has not had its first accumulator update (or it is 136 years since launch).`)
	  if (accumulator1 === 0n) throw new Error(`Exchange ${addressToString(exchangeAddress)} has not had its first accumulator update (or it is 136 years since launch).`)
	  const numeratorReserve = (0 === quoteTokenIndex) ? reserve0 : reserve1
	  const denominatorReserve = (0 === quoteTokenIndex) ? reserve1 : reserve0
	  const accumulator = (0 === quoteTokenIndex) ? accumulator1 : accumulator0
	  const timeElapsedSinceLastAccumulatorUpdate = timestamp - blockTimestampLast
	  const priceNow = numeratorReserve * 2n ** 112n / denominatorReserve
	  return accumulator + timeElapsedSinceLastAccumulatorUpdate * priceNow
	}
  
	const latestBlock = await eth_getBlockByNumber('latest')
	if (latestBlock === null) throw new Error(`Block 'latest' does not exist.`)
	const historicBlock = await eth_getBlockByNumber(blockNumber)
	if (historicBlock === null) throw new Error(`Block ${blockNumber} does not exist.`)
	const [latestAccumulator, historicAccumulator] = await Promise.all([
	  await getAccumulatorValue(latestBlock.number, latestBlock.timestamp),
	  await getAccumulatorValue(blockNumber, historicBlock.timestamp)
	])
  
	const accumulatorDelta = latestAccumulator - historicAccumulator
	const timeDelta = latestBlock.timestamp - historicBlock.timestamp
	return timeDelta === 0n ? accumulatorDelta : accumulatorDelta / timeDelta
}