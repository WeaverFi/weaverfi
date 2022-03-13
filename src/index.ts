
// Imports:
import * as evm from './functions';
import * as terra from './terra-functions';
import type { Chain, Address, TerraAddress, TokenData, TerraTokenData, ABI } from './types';

// Required JSON Files:
const projects: Record<Chain, string[]> = require('../static/projects.json');

/* ========================================================================================================================================================================= */

// WeaverFi Functionality:
export const WeaverFi = {

  // Ethereum Functions:
  ETH: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('eth', address, abi, method, args);
    },
    isWallet: (address: Address) => {
      return evm.isWallet(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('eth', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('eth', wallet, project);
    },
    getTokens: () => {
      return evm.getTokens('eth');
    },
    getProjects: () => {
      return projects['eth'];
    }
  },

  // Binance Smart Chain Functions:
  BSC: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('bsc', address, abi, method, args);
    },
    isWallet: (address: Address) => {
      return evm.isWallet(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('bsc', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('bsc', wallet, project);
    },
    getTokens: () => {
      return evm.getTokens('bsc');
    },
    getProjects: () => {
      return projects['bsc'];
    }
  },

  // Polygon Functions:
  POLY: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('poly', address, abi, method, args);
    },
    isWallet: (address: Address) => {
      return evm.isWallet(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('poly', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('poly', wallet, project);
    },
    getTokens: () => {
      return evm.getTokens('poly');
    },
    getProjects: () => {
      return projects['poly'];
    }
  },

  // Fantom Functions:
  FTM: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('ftm', address, abi, method, args);
    },
    isWallet: (address: Address) => {
      return evm.isWallet(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('ftm', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('ftm', wallet, project);
    },
    getTokens: () => {
      return evm.getTokens('ftm');
    },
    getProjects: () => {
      return projects['ftm'];
    }
  },

  // Avalanche Functions:
  AVAX: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('avax', address, abi, method, args);
    },
    isWallet: (address: Address) => {
      return evm.isWallet(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('avax', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('avax', wallet, project);
    },
    getTokens: () => {
      return evm.getTokens('avax');
    },
    getProjects: () => {
      return projects['avax'];
    }
  },

  // Harmony Functions:
  ONE: {
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query('one', address, abi, method, args);
    },
    isWallet: (address: Address) => {
      return evm.isWallet(address);
    },
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance('one', wallet);
    },
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance('one', wallet, project);
    },
    getTokens: () => {
      return evm.getTokens('one');
    },
    getProjects: () => {
      return projects['one'];
    }
  },

  // Terra Functions:
  TERRA: {
    query: (address: TerraAddress, query: any) => {
      return terra.query(address, query);
    },
    isWallet: (address: TerraAddress) => {
      return terra.isWallet(address);
    },
    getWalletBalance: (wallet: TerraAddress) => {
      return terra.getWalletBalance(wallet);
    },
    getProjectBalance: (wallet: TerraAddress, project: string) => {
      return terra.getProjectBalance(wallet, project);
    },
    getTokens: () => {
      return terra.getTokens();
    },
    getProjects: () => {
      return projects['terra'];
    }
  },

  /* ================================================== */

  // Function to get all supported projects:
  getAllProjects: () => {
    return projects;
  },

  // Function to get a list of all tracked tokens:
  getAllTokens: () => {
    let tokens: Record<Chain, (TokenData | TerraTokenData)[]> = { 'eth': [], 'bsc': [], 'poly': [], 'ftm': [], 'avax': [], 'one': [], 'terra': [] };
    Object.keys(tokens).forEach(stringChain => {
      let chain = stringChain as Chain;
      if(chain === 'terra') {
        tokens[chain].push(...terra.getTokens());
      } else {
        tokens[chain].push(...evm.getTokens(chain));
      }
    });
    return tokens;
  }
}

// Exporting Default Module:
export default WeaverFi;