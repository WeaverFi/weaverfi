
// Type Imports:
import type { Chain, ChainData, URL } from './types';

/* ========================================================================================================================================================================= */

// Default chain RPC endpoints:
export const defaultRpcEndpoints: Record<Chain, URL[]> = {
  eth: [
    'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    'https://eth-rpc.gateway.pokt.network',
    'https://rpc.ankr.com/eth'
  ],
  bsc: [
    'https://bsc-dataseed.binance.org',
    'https://bsc-mainnet.gateway.pokt.network/v1/lb/6136201a7bad1500343e248d',
    'https://rpc.ankr.com/bsc'
  ],
  poly: [
    'https://polygon-rpc.com',
    'https://poly-rpc.gateway.pokt.network/',
    'https://rpc.ankr.com/polygon'
  ],
  ftm: [
    'https://rpc.ftm.tools/',
    'https://rpcapi.fantom.network',
    'https://rpc.ankr.com/fantom'
  ],
  avax: [
    'https://api.avax.network/ext/bc/C/rpc',
    'https://avax-mainnet.gateway.pokt.network/v1/lb/605238bf6b986eea7cf36d5e/ext/bc/C/rpc',
    'https://rpc.ankr.com/avalanche'
  ],
  cronos: [
    'https://evm-cronos.crypto.org',
    'https://rpc.vvs.finance'
  ],
  op: [
    'https://mainnet.optimism.io',
    'https://optimism-mainnet.public.blastapi.io',
    'https://rpc.ankr.com/optimism'
  ],
  arb: [
    'https://arb1.arbitrum.io/rpc',
    'https://rpc.ankr.com/arbitrum'
  ]
}

/* ========================================================================================================================================================================= */

// Exporting Chain Data:
export const chains: Record<Chain, ChainData> = {
  eth: {
    id: 1,
    name: 'Ethereum',
    token: 'ETH',
    wrappedToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [...defaultRpcEndpoints.eth],
    coingeckoIDs: {
      chainID: 'ethereum',
      nativeTokenID: 'ethereum'
    },
    multicall: '0x5ba1e12693dc8f9c48aad8770482f4739beed696'
  },
  bsc: {
    id: 56,
    name: 'BNB Chain',
    token: 'BNB',
    wrappedToken: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    usdcDecimals: 18,
    inch: true,
    paraswap: true,
    rpcs: [...defaultRpcEndpoints.bsc],
    coingeckoIDs: {
      chainID: 'binance-smart-chain',
      nativeTokenID: 'binancecoin'
    },
    multicall: '0xc50f4c1e81c873b2204d7eff7069ffec6fbe136d'
  },
  poly: {
    id: 137,
    name: 'Polygon',
    token: 'MATIC',
    wrappedToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [...defaultRpcEndpoints.poly],
    coingeckoIDs: {
      chainID: 'polygon-pos',
      nativeTokenID: 'matic-network'
    },
    multicall: '0x275617327c958bd06b5d6b871e7f491d76113dd8'
  },
  ftm: {
    id: 250,
    name: 'Fantom',
    token: 'FTM',
    wrappedToken: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    usdc: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
    usdcDecimals: 6,
    inch: false,
    paraswap: true,
    rpcs: [...defaultRpcEndpoints.ftm],
    coingeckoIDs: {
      chainID: 'fantom',
      nativeTokenID: 'fantom'
    },
    multicall: '0xd98e3dbe5950ca8ce5a4b59630a5652110403e5c'
  },
  avax: {
    id: 43114,
    name: 'Avalanche',
    token: 'AVAX',
    wrappedToken: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    usdc: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [...defaultRpcEndpoints.avax],
    coingeckoIDs: {
      chainID: 'avalanche',
      nativeTokenID: 'avalanche-2'
    },
    multicall: '0xed386fe855c1eff2f843b910923dd8846e45c5a4'
  },
  cronos: {
    id: 25,
    name: 'Cronos',
    token: 'CRO',
    wrappedToken: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
    usdc: '0xc21223249ca28397b4b6541dffaecc539bff0c59',
    usdcDecimals: 6,
    inch: false,
    paraswap: false,
    rpcs: [...defaultRpcEndpoints.cronos],
    coingeckoIDs: {
      chainID: 'cronos',
      nativeTokenID: 'crypto-com-chain'
    },
    multicall: '0x5e954f5972ec6bfc7decd75779f10d848230345f'
  },
  op: {
    id: 10,
    name: 'Optimism',
    token: 'ETH',
    wrappedToken: '0x4200000000000000000000000000000000000006',
    usdc: '0x7f5c764cbc14f9669b88837ca1490cca17c31607',
    usdcDecimals: 6,
    inch: true,
    paraswap: false,
    rpcs: [...defaultRpcEndpoints.op],
    coingeckoIDs: {
      chainID: 'optimistic-ethereum',
      nativeTokenID: 'ethereum'
    },
    multicall: '0xeaa6877139d436dc6d1f75f3af15b74662617b2c'
  },
  arb: {
    id: 42161,
    name: 'Arbitrum',
    token: 'ETH',
    wrappedToken: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
    usdc: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [...defaultRpcEndpoints.arb],
    coingeckoIDs: {
      chainID: 'arbitrum-one',
      nativeTokenID: 'ethereum'
    },
    multicall: '0x842ec2c7d803033edf55e478f461fc547bc54eb2'
  }
}