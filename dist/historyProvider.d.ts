import { TokenType } from "./types";
export declare const resolutionToPeriod: {
    5: string;
    15: string;
    60: string;
    240: string;
    '1D': string;
};
export declare type CandleType = {
    low: number;
    open: number;
    time: number;
    close: number;
    high: number;
    volume: number;
};
export declare type CandleFromApiType = {
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
    getBars: ({ route, resolution, inputToken, outputToken, limit, to }: {
        inputToken: TokenType;
        outputToken: TokenType;
        route: string;
        resolution: string;
        limit: number;
        to: number;
    }) => Promise<CandleType[]>;
};
export default _default;
