
// Imports:
import { chains } from './chains';
import { getChainTokenData, fetchData, defaultAddress } from './functions';

// Type Imports:
import type { Address, Chain, URL, TokenPriceData, TokenData } from './types';

// Prices Object:
export let prices: Record<Chain, TokenPriceData[]> = { eth: [], bsc: [], poly: [], ftm: [], avax: [], cronos: [], op: [], arb: [] };

// Initializations:
const maxPriceAge = 60000 * 20; // 20 Minutes

/* ========================================================================================================================================================================= */

/**
 * Function to populate the `prices` object with all tracked tokens' prices.
 * @returns Current state of the `prices` object post-update.
 */
export const getAllTokenPrices = async () => {
  let promises = Object.keys(chains).map(stringChain => (async () => {
    let chain = stringChain as Chain;
    await getChainTokenPrices(chain);
  })());
  await Promise.all(promises);
  return prices;
}

/* ========================================================================================================================================================================= */

/**
 * Function to populate the `prices` object with all tracked tokens' prices in one chain.
 * @param chain - The blockchain to query tokens' prices for.
 * @returns Current state of the `prices` object post-update, including only the selected chain.
 */
export const getChainTokenPrices = async (chain: Chain) => {
  let data = getChainTokenData(chain);
  let missingPrices: TokenData[] = [];
  if(data) {

    // Querying All Tokens Through CoinGecko:
    let addresses = data.tokens.map(token => token.address);
    addresses.push(defaultAddress);
    await queryCoinGeckoPrices(chain, addresses);

    // Checking Missing Token Prices:
    for(let token of data.tokens) {
      let foundToken = checkTokenPrice(chain, token.address);
      if(!foundToken || (Date.now() - foundToken.timestamp) > maxPriceAge) {
        let priceFound = false;

        // Querying 1Inch:
        if(chains[chain].inch && !priceFound) {
          await query1InchPrice(chain, token.address as Address, token.decimals);
          foundToken = checkTokenPrice(chain, token.address);
          if(foundToken) {
            priceFound = true;
          }
        }

        // Querying ParaSwap:
        if(chains[chain].paraswap && !priceFound) {
          await queryParaSwapPrice(chain, token.address as Address, token.decimals);
          foundToken = checkTokenPrice(chain, token.address);
          if(foundToken) {
            priceFound = true;
          }
        }

        // Token Redirections:
        if(!priceFound) {
          await redirectTokenPriceFeed(chain, token.address);
          foundToken = checkTokenPrice(chain, token.address);
          if(foundToken) {
            priceFound = true;
          }
        }

        // Token Price Not Found:
        if(!priceFound) {
          missingPrices.push(token);
        }
      }
    }
  }

  // Logging Missing Token Prices:
  if(missingPrices.length > 0) {
    let stringMissingPrices = '';
    missingPrices.forEach(token => {
      stringMissingPrices += ` ${token.symbol} (${token.address}),`;
    });
    console.warn(`${chain.toUpperCase()}: Missing Token Prices:${stringMissingPrices.slice(0, -1)}`);
  }

  // Returning Token Prices:
  return prices[chain];
}

/* ========================================================================================================================================================================= */

/**
 * Function to populate the `prices` object with all native tokens' prices.
 * @returns Current state of the `prices` object post-update.
 */
export const getNativeTokenPrices = async () => {

  // Initializations:
  let nativeTokens: { chain: Chain, id: string }[] = [];
  let stringNativeTokens = '';

  // Formatting Token IDs:
  Object.keys(chains).forEach(stringChain => {
    let chain = stringChain as Chain;
    let id = chains[chain].coingeckoIDs.nativeTokenID;
    nativeTokens.push({ chain, id });
    stringNativeTokens += id + ',';
  });

  // Querying Native Token Prices:
  let apiQuery: URL = `https://api.coingecko.com/api/v3/simple/price/?ids=${stringNativeTokens.slice(0, -1)}&vs_currencies=usd`;
  try {
    let response = await fetchData(apiQuery);
    nativeTokens.forEach(token => {
      updatePrices(token.chain, {
        symbol: chains[token.chain].token,
        address: defaultAddress,
        price: response[token.id].usd,
        source: 'coingecko',
        timestamp: Date.now()
      });
    });
  } catch {}
  return prices;
}

/* ========================================================================================================================================================================= */

/**
 * Function to get a token's current price by checking all price sources sequentially until a value is found.
 * @param chain - The blockchain in which the given token is in.
 * @param address - The token's address.
 * @param decimals - The token's decimals.
 * @returns The token's price (also updates the `prices` object).
 */
export const getTokenPrice = async (chain: Chain, address: Address, decimals?: number): Promise<number> => {

  // Initializations:
  let priceFound = false;
  let maxTime = Date.now() - maxPriceAge;

  // Querying CoinGecko:
  await queryCoinGeckoPrices(chain, [address]);
  let token = checkTokenPrice(chain, address);
  if(token && maxTime < token.timestamp) {
    priceFound = true;
    return token.price;
  }

  // Querying 1Inch:
  if(chains[chain].inch && decimals && !priceFound) {
    await query1InchPrice(chain, address as Address, decimals);
    let token = checkTokenPrice(chain, address);
    if(token && maxTime < token.timestamp) {
      priceFound = true;
      return token.price;
    }
  }

  // Querying ParaSwap:
  if(chains[chain].paraswap && decimals && !priceFound) {
    await queryParaSwapPrice(chain, address as Address, decimals);
    let token = checkTokenPrice(chain, address);
    if(token && maxTime < token.timestamp) {
      priceFound = true;
      return token.price;
    }
  }

  // Token Redirections:
  if(!priceFound) {
    await redirectTokenPriceFeed(chain, address);
    let token = checkTokenPrice(chain, address);
    if(token && maxTime < token.timestamp) {
      priceFound = true;
      return token.price;
    }
  }

  // Logging Error & Returning Price 0:
  console.warn(`${chain.toUpperCase()}: Token Price Not Found - ${address}`);
  return 0;
}

/* ========================================================================================================================================================================= */

/**
 * Function to check a previously queried token's price.
 * @param chain - The blockchain in which the given token is in.
 * @param address - The token's address.
 * @returns The token's price if previously queried, else undefined.
 */
export const checkTokenPrice = (chain: Chain, address: Address) => {
  let foundToken = prices[chain].find(token => token.address == address.toLowerCase());
  if(foundToken) {
    return foundToken;
  } else {
    return undefined;
  }
}

/* ========================================================================================================================================================================= */

/**
 * Function to query token prices from CoinGecko, and update the `prices` object.
 * @param chain - The blockchain in which the tokens are in.
 * @param addresses - The tokens' addresses.
 */
export const queryCoinGeckoPrices = async (chain: Chain, addresses: Address[]) => {

  // Initializations:
  let formattedAddresses = '';
  let needNativeQuery = false;

  // Preparing Query:
  addresses.forEach(address => {
    if(address === defaultAddress) {
      needNativeQuery = true;
    } else {
      formattedAddresses += address.toLowerCase() + ',';
    }
  });

  // Querying Native Asset Price:
  if(needNativeQuery) {
    let apiQuery: URL = `https://api.coingecko.com/api/v3/simple/price/?ids=${chains[chain].coingeckoIDs.nativeTokenID}&vs_currencies=usd`;
    try {
      let response = await fetchData(apiQuery);
      updatePrices(chain, {
        symbol: chains[chain].token,
        address: defaultAddress,
        price: response[Object.keys(response)[0]].usd,
        source: 'coingecko',
        timestamp: Date.now()
      });
    } catch {}
  }

  // Querying Token Prices:
  if(formattedAddresses.length > 0) {
    formattedAddresses = formattedAddresses.slice(0, -1);
    let apiQuery: URL = `https://api.coingecko.com/api/v3/simple/token_price/${chains[chain].coingeckoIDs.chainID}?contract_addresses=${formattedAddresses}&vs_currencies=usd`;
    try {
      let response = await fetchData(apiQuery);
      let tokens = Object.keys(response);
      if(tokens.length != 0) {
        tokens.forEach(token => {
          if(response[token].usd) {
            updatePrices(chain, {
              symbol: null,
              address: token.toLowerCase() as Address,
              price: response[token].usd,
              source: 'coingecko',
              timestamp: Date.now()
            });
          }
        });
      }
    } catch {}
  }
}

/* ========================================================================================================================================================================= */

/**
 * Function to query a token's price from 1Inch, and update the `prices` object.
 * @param chain - The blockchain in which the token is in.
 * @param address - The token's address.
 * @param decimals - The token's decimals.
 */
export const query1InchPrice = async (chain: Chain, address: Address, decimals: number) => {

  // Checking For Compatibility:
  if(chains[chain].inch) {

    // Returning USDC Token Price:
    if(address.toLowerCase() === chains[chain].usdc) {
      updatePrices(chain, {
        symbol: 'USDC',
        address: chains[chain].usdc,
        price: 1,
        source: '1inch',
        timestamp: Date.now()
      });
  
    // Querying Token Price:
    } else {
      let apiQuery: URL = `https://api.1inch.exchange/v4.0/${chains[chain].id}/quote?fromTokenAddress=${address}&toTokenAddress=${chains[chain].usdc}&amount=${10 ** decimals}`;
      try {
        let response = await fetchData(apiQuery);
        if(response.protocols.length < 4) {
          updatePrices(chain, {
            symbol: response.fromToken.symbol,
            address: address.toLowerCase() as Address,
            price: response.toTokenAmount / (10 ** chains[chain].usdcDecimals),
            source: '1inch',
            timestamp: Date.now()
          });
        }
      } catch {}
    }
  }
}

/* ========================================================================================================================================================================= */

/**
 * Function to query a token's price from ParaSwap, and update the `prices` object.
 * @param chain - The blockchain in which the token is in.
 * @param address - The token's address.
 * @param decimals - The token's decimals.
 */
export const queryParaSwapPrice = async (chain: Chain, address: Address, decimals: number) => {

  // Checking For Compatibility:
  if(chains[chain].paraswap) {

    // Returning USDC Token Price:
    if(address.toLowerCase() === chains[chain].usdc) {
      updatePrices(chain, {
        symbol: 'USDC',
        address: chains[chain].usdc,
        price: 1,
        source: 'paraswap',
        timestamp: Date.now()
      });

    // Querying Token Price:
    } else {
      let apiQuery: URL = `https://apiv5.paraswap.io/prices?srcToken=${address}&srcDecimals=${decimals}&destToken=${chains[chain].usdc}&destDecimals=${chains[chain].usdcDecimals}&amount=${10 ** decimals}&side=SELL&network=${chains[chain].id}`;
      try {
        let response = await fetchData(apiQuery);
        let results = Object.keys(response);
        if(results.length != 0) {
          updatePrices(chain, {
            symbol: null,
            address: address.toLowerCase() as Address,
            price: response[results[0]].destAmount / (10 ** chains[chain].usdcDecimals),
            source: 'paraswap',
            timestamp: Date.now()
          });
        }
      } catch {}
    }
  }
}

/* ========================================================================================================================================================================= */

/**
 * Function to update the `prices` object with a token's newly queried price.
 * @param chain - The blockchain in which the token is in.
 * @param priceData - The token's new price data.
 */
export const updatePrices = (chain: Chain, priceData: TokenPriceData) => {
  let foundPrice = prices[chain].findIndex(token => token.address == priceData.address);
  if(foundPrice != -1) {
    if(priceData.timestamp > prices[chain][foundPrice].timestamp) {
      prices[chain][foundPrice].price = priceData.price;
      prices[chain][foundPrice].source = priceData.source;
      prices[chain][foundPrice].timestamp = priceData.timestamp;
    }
  } else {
    if(!priceData.symbol) {
      let data = getChainTokenData(chain);
      if(data) {
        let foundToken = data.tokens.find(token => token.address.toLowerCase() === priceData.address.toLowerCase());
        if(foundToken) {
          priceData.symbol = foundToken.symbol;
        }
      }
    }
    prices[chain].push(priceData);
  }
}

/* ========================================================================================================================================================================= */

/**
 * Function to redirect common token's price feeds where necessary to other equivalent token's price sources, and update the `prices` object.
 * @param chain - The chain the original token is in.
 * @param address - The original token's address.
 */
const redirectTokenPriceFeed = async (chain: Chain, address: Address) => {

  // Initializations:
  let proxyToken: { chain: Chain, address: Address, decimals?: number } | undefined = undefined;

  // Redirecting Price Feed:
  switch(chain) {
    case 'eth':
      switch(address.toLowerCase()) {
        // None yet.
      }
      break;
    case 'bsc':
      switch(address.toLowerCase()) {
        // None yet.
      }
      break;
    case 'poly':
      switch(address.toLowerCase()) {
        case '0x3ba4c387f786bfee076a58914f5bd38d668b42c3': // BNB
          proxyToken = { chain: 'bsc', address: defaultAddress, decimals: 18 };
          break;
      }
      break;
    case 'ftm':
      switch(address.toLowerCase()) {
        case '0x3d8f1accee8e263f837138829b6c4517473d0688': // fWINGS
          proxyToken = { chain: 'bsc', address: '0x0487b824c8261462f88940f97053e65bdb498446', decimals: 18 };
          break;
      }
      break;
    case 'avax':
      switch(address.toLowerCase()) {
        // None yet.
      }
      break;
    case 'cronos':
      switch(address.toLowerCase()) {
        case '0xbed48612bc69fa1cab67052b42a95fb30c1bcfee': // SHIB
          proxyToken = { chain: 'eth', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', decimals: 18 };
          break;
        case '0xb888d8dd1733d72681b30c00ee76bde93ae7aa93': // ATOM
          proxyToken = { chain: 'bsc', address: '0x0eb3a705fc54725037cc9e008bdede697f62f335', decimals: 18 };
          break;
        case '0x1a8e39ae59e5556b56b76fcba98d22c9ae557396': // DOGE
          proxyToken = { chain: 'bsc', address: '0xba2ae424d960c26247dd6c32edc70b295c744c43', decimals: 8 };
          break;
      }
      break;
    case 'op':
      switch(address.toLowerCase()) {
        // None yet.
      }
      break;
    case 'arb':
      switch(address.toLowerCase()) {
        // Nont yet.
      }
  }

  // Fetching Proxy Token Price & Updating Token Price:
  if(proxyToken) {
    let tokenPrice = await getTokenPrice(proxyToken.chain, proxyToken.address, proxyToken.decimals);
    let proxyTokenData = checkTokenPrice(proxyToken.chain, proxyToken.address);
    if(proxyTokenData) {
      updatePrices(chain, {
        symbol: null,
        address: address.toLowerCase() as Address,
        price: tokenPrice,
        source: proxyTokenData.source,
        timestamp: Date.now()
      });
    }
  }
}