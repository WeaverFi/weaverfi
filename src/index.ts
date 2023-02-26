
// Imports:
import * as $ from './prices';
import * as evm from './functions';
import { chains } from './chains';
import { projects } from './projects';
import { ChainFunctions, ETHChainFunctions } from './chain-functions';

// Type Imports:
import type { Chain, Address } from './types';

/* ========================================================================================================================================================================= */

// WeaverFi Functionality:
export const WeaverFi = {

  // Chain-Specific Functions:
  eth: new ETHChainFunctions('eth'),
  bsc: new ChainFunctions('bsc'),
  poly: new ChainFunctions('poly'),
  ftm: new ChainFunctions('ftm'),
  avax: new ChainFunctions('avax'),
  cronos: new ChainFunctions('cronos'),
  op: new ChainFunctions('op'),
  arb: new ChainFunctions('arb'),

  /* ================================================== */

  /**
   * Function to get all supported chains.
   * @returns An array of all supported chain abbreviations.
   */
  getAllChains: () => {
    return Object.keys(projects) as Chain[];
  },

  /**
   * Function to fetch information from all supported chains.
   * @returns A record of chain information in JSON format.
   */
  getAllChainInfo: () => {
    return chains;
  },

  /**
   * Function to get a list of all supported projects.
   * @returns A record of project name arrays for each chain.
   */
  getAllProjects: () => {
    return projects;
  },

  /**
   * Function to get a list of all tracked tokens on all chains.
   * @returns A record of arrays of tracked tokens on every chain.
   */
  getAllTokens: () => {
    return evm.getAllTokens();
  },

  /**
   * Function to populate the `prices` object with all tracked tokens' prices.
   * 
   * If a token's price has already been queried, it will use that instead of refetching, unless `forceRefetch` is set to `true`.
   * 
   * The default time until a price value is considered stale is `20 minutes`. This can be overwritten through the `maxAgeInMs` option.
   * @param options Optional settings.
   * @returns Current state of the `prices` object post-update.
   */
  getAllTokenPrices: (options?: { forceRefetch?: boolean, maxAgeInMs?: number }) => {
    return $.getAllTokenPrices(options);
  },

  /**
   * Function to populate the `prices` object with all native tokens' prices.
   * @returns Current state of the `prices` object post-update.
   */
  getNativeTokenPrices: () => {
    return $.getNativeTokenPrices();
  },

  /**
   * Function to check all previously queried token prices.
   * @returns Current state of the `prices` object for all chains.
   */
  checkPrices: () => {
    return $.prices;
  },

  /**
   * Function to fetch all balances for a given wallet, including in their wallets and in dapps/projects.
   * 
   * NOTE: This function queries a ton of data. It is recommended to use other more targeted methods.
   * @param wallet The wallet to query balances for.
   * @returns A wallet's token, project and NFT balances.
   */
  getAllBalances: (wallet: Address) => {
    return evm.getAllBalances(wallet);
  }
}

// Exporting Default Module:
export default WeaverFi;

// Exporting Types:
export * from './types';