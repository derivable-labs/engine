import { IEngineConfig, INetworkConfig } from "./utils/configs";
export declare class Profile {
    chainId: number;
    env: 'dev' | 'production';
    configs: INetworkConfig;
    routes: {
        [key: string]: {
            type: string;
            address: string;
        }[];
    };
    constructor(engineConfig: IEngineConfig);
    loadConfig(): Promise<void>;
    getAbi(name: string): any;
    getEventDataAbi(): any;
}
