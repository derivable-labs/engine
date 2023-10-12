"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMemoryRpc = exports.createMnemonicRpc = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
const ethereum_fetch_json_rpc_1 = require("@zoltu/ethereum-fetch-json-rpc");
const signers_1 = require("./signers");
async function createMnemonicRpc(jsonRpcHttpEndpoint, gasPrice) {
    // address: 0xfc2077CA7F403cBECA41B1B0F62D91B5EA631B5En
    const signer = await signers_1.MnemonicSigner.create('zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong'.split(' '));
    const gasPriceInAttoethProvider = async () => gasPrice;
    const addressProvider = async () => signer.address;
    const signatureProvider = signer.sign;
    return new ethereum_fetch_json_rpc_1.FetchJsonRpc(jsonRpcHttpEndpoint, node_fetch_1.default, { gasPriceInAttoethProvider, addressProvider, signatureProvider });
}
exports.createMnemonicRpc = createMnemonicRpc;
async function createMemoryRpc(jsonRpcHttpEndpoint, gasPrice) {
    // address: 0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Ebn
    const signer = await signers_1.PrivateKeySigner.create(0x60f5906de1edfc4d14eb4aea49ed4c06641bbdbd5a56092392308e9730598373n);
    const gasPriceInAttoethProvider = async () => gasPrice;
    const addressProvider = async () => signer.address;
    const signatureProvider = signer.sign;
    return new ethereum_fetch_json_rpc_1.FetchJsonRpc(jsonRpcHttpEndpoint, node_fetch_1.default, { gasPriceInAttoethProvider, addressProvider, signatureProvider });
}
exports.createMemoryRpc = createMemoryRpc;
//# sourceMappingURL=rpc-factories.js.map