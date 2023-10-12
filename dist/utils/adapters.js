"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethGetBlockByNumber = void 0;
async function ethGetBlockByNumber(rpc, blockNumber) {
    const result = await rpc.getBlockByNumber(false, blockNumber);
    if (result === null)
        throw new Error(`Unknown block number ${blockNumber}`);
    if (result.logsBloom === null)
        throw new Error(`Block ${blockNumber} was missing 'logsBloom' field.`);
    if (result.number === null)
        throw new Error(`Block ${blockNumber} was missing 'number' field.`);
    return {
        ...result,
        logsBloom: result.logsBloom,
        number: result.number,
        timestamp: BigInt(result.timestamp.getTime() / 1000),
        mixHash: result.mixHash !== null ? result.mixHash : undefined,
    };
}
exports.ethGetBlockByNumber = ethGetBlockByNumber;
//# sourceMappingURL=adapters.js.map