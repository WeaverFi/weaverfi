
// Imports:
import * as ens from './ens';
import * as $ from './prices';
import * as evm from './functions';
import { chains, defaultRpcEndpoints } from './chains';
import { projects } from './projects';
import { WeaverError } from './error';

// Type Imports:
import type { Chain, Address, URL, TokenPriceData, ABI, ENSDomain } from './types';

/* ========================================================================================================================================================================= */

// Chain-Specific Functions Class:
export class ChainFunctions {

  // Class Constructor:
  constructor(private chain: Chain) {
    this.chain = chain;
  }

  /**
   * Function to make blockchain queries.
   * @param address The contract's address to query.
   * @param abi The contract's ABI.
   * @param method The method to be called from the contract.
   * @param args Any arguments to pass to the method called.
   * @param block The block height from which to query info from. (Optional)
   * @returns Query results.
   */
  query(address: Address, abi: ABI, method: string, args: any[], block?: number) {
    return evm.query(this.chain, address, abi, method, args, block);
  }

  /**
   * Function to query blocks for events on a given contract.
   * @param address The contract's address to query.
   * @param abi The contract's ABI.
   * @param event The event name to query for.
   * @param querySize The limit to how many blocks should be queried in each batch.
   * @param args Any arguments to pass to the event filter.
   * @param options Extra info such as starting block, ending block or choosing whether to display logs or not. (Optional)
   * @returns Array of events.
   */
  queryBlocks(address: Address, abi: ABI, event: string, querySize: number, args: any[], options?: { startBlock?: number, endBlock?: number, logs?: boolean }) {
    return evm.queryBlocks(this.chain, address, abi, event, querySize, args, options);
  }
  
  /**
   * Function to check if a hash corresponds to a valid wallet/contract address.
   * @param address The hash to check for validity.
   * @returns True or false, depending on if the hash is a valid address or not.
   */
  isAddress(address: string) {
    return evm.isAddress(address);
  }
  
  /**
   * Function to get a wallet's transaction count.
   * @param wallet The wallet to query transaction count for.
   * @returns A number of transactions.
   */
  getTXCount(wallet: Address) {
    return evm.getWalletTXCount(this.chain, wallet);
  }
  
  /**
   * Function to fetch a wallet's token balances.
   * @param wallet The wallet to query balances for.
   * @returns All native and token balances for the specified wallet.
   */
  getWalletBalance(wallet: Address) {
    return evm.getWalletBalance(this.chain, wallet);
  }
  
  /**
   * Function to fetch project balances for a given wallet.
   * @param wallet The wallet to query balances for.
   * @param project The project/dapp to query for balances in.
   * @returns A wallet's balance on the specified project/dapp.
   */
  getProjectBalance(wallet: Address, project: string) {
    return evm.getProjectBalance(this.chain, wallet, project);
  }
  
  /**
   * Function to fetch all project balances for a given wallet.
   * @param wallet The wallet to query balances for.
   * @returns A wallet's balance on all projects/dapps.
   */
  getAllProjectBalances(wallet: Address) {
    return evm.getAllProjectBalances(this.chain, wallet);
  }
  
  /**
   * Function to get a wallet's NFT balance.
   * @param wallet The wallet to query NFT balances for.
   * @returns An array of NFT objects if any balances are found.
   */
  getNFTBalance(wallet: Address) {
    return evm.getWalletNFTBalance(this.chain, wallet);
  }
  
  /**
   * Function to get a list of all tracked tokens.
   * @returns An array of all tracked tokens.
   */
  getTokens() {
    return evm.getTokens(this.chain);
  }
  
  /**
   * Function to get a token's logo.
   * @param symbol The token's symbol.
   * @returns The token logo if available, else a generic coin logo.
   */
  getTokenLogo(symbol: string) {
    return evm.getTokenLogo(this.chain, symbol);
  }
  
  /**
   * Function to get gas estimates for TXs.
   * @returns The gas price, token price and gas estimates for various TX types.
   */
  getGasEstimates() {
    return evm.getGasEstimates(this.chain);
  }
  
  /**
   * Function to fetch some chain information.
   * @returns Some chain data in JSON format.
   */
  getInfo() {
    return chains[this.chain];
  }
  
  /**
   * Function to fetch the list of projects available.
   * @returns An array of project names.
   */
  getProjects() {
    return projects[this.chain];
  }
  
  /**
   * Function to populate the `prices` object with token prices.
   * @returns Current state of the `prices` object post-update.
   */
  getTokenPrices() {
    return $.getChainTokenPrices(this.chain);
  }
  
  /**
   * Function to get a token's current price.
   * @param address The token's address.
   * @param decimals The token's decimals.
   * @returns The token's price (also updates the `prices` object).
   */
  getTokenPrice(address: Address, decimals?: number) {
    return $.getTokenPrice(this.chain, address, decimals);
  }
  
  /**
   * Function to update the `prices` object with a token's newly queried price.
   * @param priceData The token's new price data.
   */
  updateTokenPrice(priceData: TokenPriceData) {
    return $.updatePrices(this.chain, priceData);
  }
  
  /**
   * Function to check all previously queried token prices.
   * @returns Current state of the `prices` object.
   */
  checkPrices() {
    return $.prices[this.chain];
  }

  /**
   * Function to set custom RPC endpoints.
   * @param rpcs An array of RPC endpoints to use.
   * @param options Extra toggles such as enabling the default RPC endpoints as fallbacks. (Optional)
   */
  setCustomRpcEndpoints(rpcs: URL[], options?: { includeDefaults?: boolean }) {
    if(rpcs.length > 0) {
      if(options?.includeDefaults) {
        chains[this.chain].rpcs = [...rpcs, ...defaultRpcEndpoints[this.chain]];
      } else {
        chains[this.chain].rpcs = [...rpcs];
      }
      evm.updateChainProviders(this.chain);
    } else if(!options?.includeDefaults) {
      throw new WeaverError(this.chain, null, 'No custom RPC endpoints were provided and defaults are not enabled.');
    }
  }

  /**
   * Function to get ethers providers currently intialized.
   * @returns An array of ethers static providers.
   */
  getProviders() {
    return evm.providers[this.chain];
  }
}

/* ========================================================================================================================================================================= */

// Extra ETH Functions Class:
export class ETHChainFunctions extends ChainFunctions {

  /**
   * Function to resolve an ENS domain name into an address.
   * @param name The ENS domain name to resolve.
   * @returns An address if resolvable, else null.
   */
  resolveENS(name: ENSDomain) {
    return ens.resolveENS(name);
  }

  /**
   * Function to reverse lookup an ENS domain.
   * @param address The address to reverse lookup.
   * @returns An ENS domain name if resolvable, else null.
   */
  lookupENS(address: Address) {
    return ens.lookupENS(address);
  }

  /**
   * Function to fetch an ENS domain's avatar.
   * @param name The ENS domain name to query info from.
   * @returns An avatar URI if available, else null.
   */
  fetchAvatarENS(name: ENSDomain) {
    return ens.fetchAvatarENS(name);
  }
}