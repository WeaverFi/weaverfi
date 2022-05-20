
// Imports:
import * as $ from './prices';
import * as evm from './functions';
import { chains } from './chains';
import { projects } from './projects';

// Type Imports:
import type { Chain, Address, TokenPriceData, ABI } from './types';

/* ========================================================================================================================================================================= */

// Function to format exported chain-specific functions:
export const chainFunctions = (chain: Chain) => {
  return {

    /**
     * Function to make blockchain queries.
     * @param address The contract's address to query.
     * @param abi The contract's ABI.
     * @param method The method to be called from the contract.
     * @param args Any arguments to pass to the method called.
     * @returns Query results.
     */
    query: (address: Address, abi: ABI[], method: string, args: any[]) => {
      return evm.query(chain, address, abi, method, args);
    },

    /**
     * Function to check if a hash corresponds to a valid wallet/contract address.
     * @param address The hash to check for validity.
     * @returns True or false, depending on if the hash is a valid address or not.
     */
    isAddress: (address: Address) => {
      return evm.isAddress(address);
    },

    /**
     * Function to get a wallet's transaction count.
     * @param wallet The wallet to query transaction count for.
     * @returns An array of NativeToken objects if any balance is found.
     */
    getTXCount: (wallet: Address) => {
      return evm.getWalletTXCount(chain, wallet);
    },

    /**
     * Function to fetch a wallet's token balances.
     * @param wallet The wallet to query balances for.
     * @returns All native and token balances for the specified wallet.
     */
    getWalletBalance: (wallet: Address) => {
      return evm.getWalletBalance(chain, wallet);
    },

    /**
     * Function to fetch project balances for a given wallet.
     * @param wallet The wallet to query balances for.
     * @param project The project/dapp to query for balances in.
     * @returns A wallet's balance on the specified project/dapp.
     */
    getProjectBalance: (wallet: Address, project: string) => {
      return evm.getProjectBalance(chain, wallet, project);
    },

    /**
     * Function to fetch all project balances for a given wallet.
     * @param wallet The wallet to query balances for.
     * @returns A wallet's balance on all projects/dapps.
     */
    getAllProjectBalances: (wallet: Address) => {
      return evm.getAllProjectBalances(chain, wallet);
    },

    /**
     * Function to get a wallet's NFT balance.
     * @param wallet The wallet to query NFT balances for.
     * @returns An array of NFT objects if any balances are found.
     */
    getNFTBalance: (wallet: Address) => {
      return evm.getWalletNFTBalance(chain, wallet);
    },

    /**
     * Function to get a list of all tracked tokens.
     * @returns An array of all tracked tokens.
     */
    getTokens: () => {
      return evm.getTokens(chain);
    },

    /**
     * Function to get a token's logo.
     * @param symbol The token's symbol.
     * @returns The token logo if available, else a generic coin logo.
     */
    getTokenLogo: (symbol: string) => {
      return evm.getTokenLogo(chain, symbol);
    },

    /**
     * Function to fetch some chain information.
     * @returns Some chain data in JSON format.
     */
    getInfo: () => {
      return chains[chain];
    },

    /**
     * Function to fetch the list of projects available.
     * @returns An array of project names.
     */
    getProjects: () => {
      return projects[chain];
    },

    /**
     * Function to populate the `prices` object with token prices.
     * @returns Current state of the `prices` object post-update.
     */
    getTokenPrices: () => {
      return $.getChainTokenPrices(chain);
    },

    /**
     * Function to get a token's current price.
     * @param address The token's address.
     * @param decimals The token's decimals.
     * @returns The token's price (also updates the `prices` object).
     */
    getTokenPrice: (address: Address, decimals?: number) => {
      return $.getTokenPrice(chain, address, decimals);
    },

    /**
     * Function to update the `prices` object with a token's newly queried price.
     * @param priceData The token's new price data.
     */
    updateTokenPrice: (priceData: TokenPriceData) => {
      return $.updatePrices(chain, priceData);
    },

    /**
     * Function to fetch all previously queried token prices.
     * @returns Current state of the `prices` object.
     */
    fetchPrices: () => {
      return $.prices[chain];
    }
  }
}