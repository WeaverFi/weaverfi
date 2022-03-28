
// Imports:
import type { EVMChain, ChainData } from './types';

// Exporting Chain Data:
export const chains: Record<EVMChain, ChainData> = {
  eth: {
    id: 1,
    token: 'ETH',
    cgID: 'ethereum',
    nativeID: 'ethereum',
    wrappedToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://eth-rpc.gateway.pokt.network'
    ]
  },
  bsc: {
    id: 56,
    token: 'BNB',
    cgID: 'binance-smart-chain',
    nativeID: 'binancecoin',
    wrappedToken: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    usdcDecimals: 18,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-mainnet.gateway.pokt.network/v1/lb/6136201a7bad1500343e248d'
    ]
  },
  poly: {
    id: 137,
    token: 'MATIC',
    cgID: 'polygon-pos',
    nativeID: 'matic-network',
    wrappedToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://polygon-rpc.com',
      'https://poly-rpc.gateway.pokt.network/'
    ]
  },
  ftm: {
    id: 250,
    token: 'FTM',
    cgID: 'fantom',
    nativeID: 'fantom',
    wrappedToken: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    usdc: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
    usdcDecimals: 6,
    inch: false,
    paraswap: true,
    rpcs: [
      'https://rpc.ftm.tools/',
      'https://rpcapi.fantom.network'
    ]
  },
  avax: {
    id: 43114,
    token: 'AVAX',
    cgID: 'avalanche',
    nativeID: 'avalanche-2',
    wrappedToken: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    usdc: '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avax-mainnet.gateway.pokt.network/v1/lb/605238bf6b986eea7cf36d5e/ext/bc/C/rpc'
    ]
  },
  one: {
    id: 1666600000,
    token: 'ONE',
    cgID: 'harmony-shard-0',
    nativeID: 'harmony',
    wrappedToken: '0xcf664087a5bb0237a0bad6742852ec6c8d69a27a',
    usdc: '0x985458e523db3d53125813ed68c274899e9dfab4',
    usdcDecimals: 6,
    inch: false,
    paraswap: false,
    rpcs: [
      'https://api.harmony.one',
      'https://harmony-0-rpc.gateway.pokt.network'
    ]
  }
}