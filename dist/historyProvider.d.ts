import { TokenType } from "./types";
export declare const resolutionToPeriod: {
    5: string;
    15: string;
    60: string;
    240: string;
    '1D': string;
};
export type CandleType = {
    low: number;
    open: number;
    time: number;
    close: number;
    high: number;
    volume: number;
};
export type CandleFromApiType = {
    s: string;
    t: number[];
    o: string[];
    c: string[];
    l: string[];
    h: string[];
    v: string[];
};
declare const _default: {
    history: {};
    getBars: ({ route, resolution, inputToken, outputToken, limit, chainId, to }: {
        inputToken: TokenType;
        outputToken: TokenType;
        route: string;
        resolution: string;
        limit: number;
        chainId: string;
        to: number;
    }) => Promise<CandleType[]>;
};
export default _default;
