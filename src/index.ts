
// Imports:
import * as $ from './prices';
import * as evm from './functions';
import { chains } from './chains';
import { projects } from './projects';

// Type Imports:
import type { Chain, Address, ENSDomain, TokenData, TokenPriceData, ABI, UpperCaseChain } from './types';

/* ========================================================================================================================================================================= */

// WeaverFi Functionality:
export const WeaverFi = {

  // Ethereum Functions:
  ETH: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('eth', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('eth', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('eth', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('eth', wallet);
    },
    getTokens: () => {
      return evm.getTokens('eth');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('eth', symbol);
    },
    getInfo: () => {
      return chains['eth'];
    },    
    getProjects: () => {
      return projects['eth'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('eth');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('eth', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('eth', priceData);
    },
    resolveENS: (address: ENSDomain) => {
      return evm.resolveENS(address);
    },
    lookupENS: (address: Address) => {
      return evm.lookupENS(address);
    }
  },

  // Binance Smart Chain Functions:
  BSC: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('bsc', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('bsc', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('bsc', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('bsc', wallet);
    },
    getTokens: () => {
      return evm.getTokens('bsc');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('bsc', symbol);
    },
    getInfo: () => {
      return chains['bsc'];
    },    
    getProjects: () => {
      return projects['bsc'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('bsc');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('bsc', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('bsc', priceData);
    }
  },

  // Polygon Functions:
  POLY: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('poly', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('poly', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('poly', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('poly', wallet);
    },
    getTokens: () => {
      return evm.getTokens('poly');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('poly', symbol);
    },
    getInfo: () => {
      return chains['poly'];
    },    
    getProjects: () => {
      return projects['poly'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('poly');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('poly', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('poly', priceData);
    }
  },

  // Fantom Functions:
  FTM: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('ftm', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('ftm', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('ftm', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('ftm', wallet);
    },
    getTokens: () => {
      return evm.getTokens('ftm');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('ftm', symbol);
    },
    getInfo: () => {
      return chains['ftm'];
    },
    getProjects: () => {
      return projects['ftm'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('ftm');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('ftm', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('ftm', priceData);
    }
  },

  // Avalanche Functions:
  AVAX: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('avax', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('avax', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('avax', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('avax', wallet);
    },
    getTokens: () => {
      return evm.getTokens('avax');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('avax', symbol);
    },
    getInfo: () => {
      return chains['avax'];
    },
    getProjects: () => {
      return projects['avax'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('avax');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('avax', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('avax', priceData);
    }
  },

  // Harmony Functions:
  ONE: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('one', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('one', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('one', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('one', wallet);
    },
    getTokens: () => {
      return evm.getTokens('one');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('one', symbol);
    },
    getInfo: () => {
      return chains['one'];
    },
    getProjects: () => {
      return projects['one'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('one');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('one', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('one', priceData);
    }
  },

  // Cronos Functions:
  CRONOS: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('cronos', address, abi, method, args);
    },
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('cronos', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('cronos', wallet, project);
    },
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances('cronos', wallet);
    },
    getTokens: () => {
      return evm.getTokens('cronos');
    },
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo('cronos', symbol);
    },
    getInfo: () => {
      return chains['cronos'];
    },
    getProjects: () => {
      return projects['cronos'];
    },
    getTokenPrices: () => {
      return $.getChainTokenPrices('cronos');
    },
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice('cronos', address, decimals);
    },
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices('cronos', priceData);
    }
  },

  /* ================================================== */

  // Function to get all supported chains:
  getAllChains: () => {
    return Object.keys(projects).map(chain => chain.toUpperCase() as UpperCaseChain);
  },

  // Function to get info from all supported chains:
  getAllChainInfo: () => {
    return chains;
  },

  // Function to get all supported projects:
  getAllProjects: () => {
    return projects;
  },

  // Function to get a list of all tracked tokens:
  getAllTokens: () => {
    let tokens: Record<Chain, TokenData[]> = { eth: [], bsc: [], poly: [], ftm: [], avax: [], one: [], cronos: [] };
    Object.keys(tokens).forEach(stringChain => {
      let chain = stringChain as Chain;
      tokens[chain].push(...evm.getTokens(chain));
    });
    return tokens;
  },

  // Function to get all tracked token's prices:
  getAllTokenPrices: () => {
    return $.getAllTokenPrices();
  },

  // Function to get native token prices from each chain:
  getNativeTokenPrices: () => {
    return $.getNativeTokenPrices();
  },

  // Function to fetch all previously queried token prices:
  fetchPrices: (chain?: Chain) => {
    if(chain) {
      return $.prices[chain];
    } else {
      return $.prices;
    }
  },

  // Function to fetch all balances from each chain:
  getAllBalances: (wallet: Address) => {
    return evm.getAllBalances(wallet);
  }
}

// Exporting Default Module:
export default WeaverFi;