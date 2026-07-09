export type ChainType = 
  | 'kross'
  | 'waves'
  | 'evm' // Ethereum, BSC, Polygon, Avalanche, Arbitrum
  | 'solana'
  | 'tron'
  | 'ton'
  | 'cosmos'
  | 'move' // Sui, Aptos
  | 'cardano' // Cardano (eUTXO, Plutus/Aiken)
  | 'bitcoin';

export type ChainCategory = 
  | 'layer1'
  | 'layer2'
  | 'sidechain'
  | 'parachain';

export interface ChainMetadata {
  id: string;
  name: string;
  type: ChainType;
  category: ChainCategory;
  chainId?: number | string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  logo: string;
  testnet?: boolean;
  features: string[];
}

export interface RPCConnection {
  chainId: string;
  url: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  latency?: number;
  blockHeight?: number;
  lastChecked?: Date;
}

export interface ChainSDK {
  type: ChainType;
  name: string;
  version: string;
  loaded: boolean;
  instance?: any;
}

export interface NetworkSwitchRequest {
  fromChainId: string;
  toChainId: string;
  timestamp: Date;
}

export interface ConnectionState {
  activeChain: string | null;
  connections: Map<string, RPCConnection>;
  sdks: Map<ChainType, ChainSDK>;
}
