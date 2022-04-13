
// Imports:
import type { Chains } from './types';

// Exporting Chain Data:
export const chains: Chains = {
  eth: {
    id: 1,
    token: 'ETH',
    wrappedToken: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    usdc: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
      'https://eth-rpc.gateway.pokt.network'
    ],
    coingeckoIDs: {
      chainID: 'ethereum',
      nativeTokenID: 'ethereum',
    }
  },
  bsc: {
    id: 56,
    token: 'BNB',
    wrappedToken: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
    usdc: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    usdcDecimals: 18,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://bsc-dataseed.binance.org',
      'https://bsc-mainnet.gateway.pokt.network/v1/lb/6136201a7bad1500343e248d'
    ],
    coingeckoIDs: {
      chainID: 'binance-smart-chain',
      nativeTokenID: 'binancecoin',
    }
  },
  poly: {
    id: 137,
    token: 'MATIC',
    wrappedToken: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    usdc: '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://polygon-rpc.com',
      'https://poly-rpc.gateway.pokt.network/'
    ],
    coingeckoIDs: {
      chainID: 'polygon-pos',
      nativeTokenID: 'matic-network',
    }
  },
  ftm: {
    id: 250,
    token: 'FTM',
    wrappedToken: '0x21be370d5312f44cb42ce377bc9b8a0cef1a4c83',
    usdc: '0x04068da6c83afcfa0e13ba15a6696662335d5b75',
    usdcDecimals: 6,
    inch: false,
    paraswap: true,
    rpcs: [
      'https://rpc.ftm.tools/',
      'https://rpcapi.fantom.network'
    ],
    coingeckoIDs: {
      chainID: 'fantom',
      nativeTokenID: 'fantom',
    }
  },
  avax: {
    id: 43114,
    token: 'AVAX',
    wrappedToken: '0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7',
    usdc: '0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e',
    usdcDecimals: 6,
    inch: true,
    paraswap: true,
    rpcs: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avax-mainnet.gateway.pokt.network/v1/lb/605238bf6b986eea7cf36d5e/ext/bc/C/rpc'
    ],
    coingeckoIDs: {
      chainID: 'avalanche',
      nativeTokenID: 'avalanche-2',
    }
  },
  one: {
    id: 1666600000,
    token: 'ONE',
    wrappedToken: '0xcf664087a5bb0237a0bad6742852ec6c8d69a27a',
    usdc: '0x985458e523db3d53125813ed68c274899e9dfab4',
    usdcDecimals: 6,
    inch: false,
    paraswap: false,
    rpcs: [
      'https://api.harmony.one',
      'https://harmony-0-rpc.gateway.pokt.network'
    ],
    coingeckoIDs: {
      chainID: 'harmony-shard-0',
      nativeTokenID: 'harmony',
    }
  },
  cronos: {
    id: 25,
    token: 'CRO',
    wrappedToken: '0x5c7f8a570d578ed84e63fdfa7b1ee72deae1ae23',
    usdc: '0xc21223249ca28397b4b6541dffaecc539bff0c59',
    usdcDecimals: 6,
    inch: false,
    paraswap: false,
    rpcs: [
      'https://evm.cronos.org'
    ],
    coingeckoIDs: {
      chainID: 'cronos',
      nativeTokenID: 'crypto-com-chain',
    }
  },
  terra: {
    token: 'LUNA',
    rpcs: [
      'https://lcd.terra.dev'
    ],
    coingeckoIDs: {
      chainID: 'terra',
      nativeTokenID: 'terra-luna',
    }
  }
}