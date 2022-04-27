
// Imports:
import axios from 'axios';
import { chains } from './chains';
import { terra_data } from './tokens';
import { getChainTokenData } from './functions';
import { Coin, LCDClient } from '@terra-money/terra.js';
import type { Address, TerraAddress, Chain, EVMChain, TokenPriceData, TokenData, TerraTokenData } from './types';

// Initializations:
const maxPriceAge = 900000; // 15 Minutes
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

// Terra Connection:
const terra = new LCDClient({ URL: chains.terra.rpcs[0], chainID: "columbus-5" });

// Prices Object:
export let prices: Record<Chain, TokenPriceData[]> = { eth: [], bsc: [], poly: [], ftm: [], avax: [], one: [], cronos: [], terra: [] };

/* ========================================================================================================================================================================= */

// Function to populate prices object with all tracked tokens:
export const getAllTokenPrices = async () => {
  let promises = Object.keys(chains).map(stringChain => (async () => {
    let chain = stringChain as Chain;
    await getChainTokenPrices(chain);
  })());
  await Promise.all(promises);
  return prices;
}

/* ========================================================================================================================================================================= */

// Function to populate prices object with a specific chain's tracked tokens:
export const getChainTokenPrices = async (chain: Chain) => {
  let data = chain != 'terra' ? getChainTokenData(chain) : terra_data;
  let missingPrices: (TokenData | TerraTokenData)[] = [];
  if(data) {

    // Querying All Tokens Through CoinGecko:
    let addresses = data.tokens.map(token => token.address);
    addresses.push(defaultAddress);
    await queryCoinGeckoPrices(chain, addresses);

    // Querying Terra Native Stablecoin Prices:
    if(chain === 'terra') {
      let luna = checkTokenPrice(chain, defaultAddress);
      if(luna) {
        await queryTerraNativeTokenPrices(luna.price);
      }
    }

    // Checking Missing Token Prices:
    for(let token of data.tokens) {
      let foundToken = checkTokenPrice(chain, token.address);
      if(!foundToken || (Date.now() - foundToken.timestamp) > maxPriceAge) {
        let priceFound = false;

        // Querying 1Inch:
        if(chain != 'terra' && chains[chain].inch && !priceFound) {
          await query1InchPrice(chain, token.address as Address, token.decimals);
          foundToken = checkTokenPrice(chain, token.address);
          if(foundToken) {
            priceFound = true;
          }
        }

        // Querying ParaSwap:
        if(chain != 'terra' && chains[chain].paraswap && !priceFound) {
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

// Function to populate prices object with all native tokens:
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
  let apiQuery = `https://api.coingecko.com/api/v3/simple/price/?ids=${stringNativeTokens.slice(0, -1)}&vs_currencies=usd`;
  try {
    let response = (await axios.get(apiQuery)).data;
    nativeTokens.forEach(token => {
      updatePrices(token.chain, {
        symbol: chains[token.chain].token,
        address: defaultAddress,
        price: response[token.id].usd,
        source: 'coingecko',
        timestamp: Date.now()
      });
    });

    // Querying Terra Native Stablecoin Prices:
    let luna = checkTokenPrice('terra', defaultAddress);
    if(luna) {
      await queryTerraNativeTokenPrices(luna.price);
    }
    
  } catch {}
  return prices;
}

/* ========================================================================================================================================================================= */

// Function to get a token's current price:
export const getTokenPrice = async (chain: Chain, address: Address | TerraAddress, decimals?: number): Promise<number> => {

  // Initializations:
  let priceFound = false;

  // Checking Prices Array For Recent Data:
  let token = checkTokenPrice(chain, address);
  if(token && (Date.now() - token.timestamp) < maxPriceAge) {
    priceFound = true;
    return token.price;
  }

  // Querying Terra Native Stablecoins:
  if(chain === 'terra' && address != defaultAddress && address.startsWith(defaultAddress)) {
    let luna = checkTokenPrice(chain, defaultAddress);
    if(luna) {
      await queryTerraNativeTokenPrices(luna.price);
    } else {
      await queryCoinGeckoPrices(chain, [defaultAddress]);
      luna = checkTokenPrice(chain, defaultAddress);
      if(luna) {
        await queryTerraNativeTokenPrices(luna.price);
      }
    }
    let token = checkTokenPrice(chain, address);
    if(token && (Date.now() - token.timestamp) < maxPriceAge) {
      priceFound = true;
      return token.price;
    }
  }

  // Querying CoinGecko:
  if(!priceFound) {
    await queryCoinGeckoPrices(chain, [address]);
    let token = checkTokenPrice(chain, address);
    if(token && (Date.now() - token.timestamp) < maxPriceAge) {
      priceFound = true;
      return token.price;
    }
  }

  // Querying 1Inch:
  if(chain != 'terra' && chains[chain].inch && decimals && !priceFound) {
    await query1InchPrice(chain, address as Address, decimals);
    let token = checkTokenPrice(chain, address);
    if(token && (Date.now() - token.timestamp) < maxPriceAge) {
      priceFound = true;
      return token.price;
    }
  }

  // Querying ParaSwap:
  if(chain != 'terra' && chains[chain].paraswap && decimals && !priceFound) {
    await queryParaSwapPrice(chain, address as Address, decimals);
    let token = checkTokenPrice(chain, address);
    if(token && (Date.now() - token.timestamp) < maxPriceAge) {
      priceFound = true;
      return token.price;
    }
  }

  // Token Redirections:
  if(!priceFound) {
    await redirectTokenPriceFeed(chain, address);
    let token = checkTokenPrice(chain, address);
    if(token && (Date.now() - token.timestamp) < maxPriceAge) {
      priceFound = true;
      return token.price;
    }
  }

  // Logging Error & Returning Price 0:
  console.warn(`${chain.toUpperCase()}: Token Price Not Found - ${address}`);
  return 0;
}

/* ========================================================================================================================================================================= */

// Function to check previously queried token price:
export const checkTokenPrice = (chain: Chain, address: Address | TerraAddress) => {
  let foundToken = prices[chain].find(token => token.address == address.toLowerCase());
  if(foundToken) {
    return foundToken;
  } else {
    return undefined;
  }
}

/* ========================================================================================================================================================================= */

// Function to query token prices from CoinGecko:
export const queryCoinGeckoPrices = async (chain: Chain, addresses: (Address | TerraAddress)[]) => {

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
    let apiQuery = `https://api.coingecko.com/api/v3/simple/price/?ids=${chains[chain].coingeckoIDs.nativeTokenID}&vs_currencies=usd`;
    try {
      let response = (await axios.get(apiQuery)).data;
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
    let apiQuery = `https://api.coingecko.com/api/v3/simple/token_price/${chains[chain].coingeckoIDs.chainID}?contract_addresses=${formattedAddresses}&vs_currencies=usd`;
    try {
      let response = (await axios.get(apiQuery)).data;
      let tokens = Object.keys(response);
      if(tokens.length != 0) {
        tokens.forEach(token => {
          if(response[token].usd) {
            updatePrices(chain, {
              symbol: null,
              address: token.toLowerCase() as Address | TerraAddress,
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

// Function to query a token's price from 1Inch:
export const query1InchPrice = async (chain: EVMChain, address: Address, decimals: number) => {

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
      let apiQuery = `https://api.1inch.exchange/v4.0/${chains[chain].id}/quote?fromTokenAddress=${address}&toTokenAddress=${chains[chain].usdc}&amount=${10 ** decimals}`;
      try {
        let response = (await axios.get(apiQuery)).data;
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

// Function to query a token's price from ParaSwap:
export const queryParaSwapPrice = async (chain: EVMChain, address: Address, decimals: number) => {

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
      let apiQuery = `https://apiv5.paraswap.io/prices?srcToken=${address}&srcDecimals=${decimals}&destToken=${chains[chain].usdc}&destDecimals=${chains[chain].usdcDecimals}&amount=${10 ** decimals}&side=SELL&network=${chains[chain].id}`;
      try {
        let response = (await axios.get(apiQuery)).data;
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

// Function to query Terra's native token prices:
export const queryTerraNativeTokenPrices = async (lunaPrice: number) => {
  let allTokens = (await terra.bank.total())[0];
  let ignoredTokens = ['uluna', 'unok', 'uidr'];
  let nativeTokens = allTokens.filter(token => token.denom.charAt(0) === 'u' && !ignoredTokens.includes(token.denom.toLowerCase()));
  let promises = nativeTokens.map(token => (async () => {
    try {
      let lunaRate = (await terra.market.swapRate(new Coin(token.denom, 10 ** 6), 'uluna')).amount.toNumber() / (10 ** 6);
      let tokenSymbol = token.denom.slice(1, -1) + 't';
      updatePrices('terra', {
        symbol: tokenSymbol.toUpperCase(),
        address: defaultAddress + tokenSymbol as Address,
        price: lunaRate * lunaPrice,
        source: 'chain',
        timestamp: Date.now()
      });
    } catch {
      console.warn(`TERRA: Token Price Not Found - ${token.denom}`);
    }
  })());
  await Promise.all(promises);
}

/* ========================================================================================================================================================================= */

// Function to update prices object with new token price:
export const updatePrices = (chain: Chain, priceData: TokenPriceData) => {
  let foundPrice = prices[chain].findIndex(token => token.address == priceData.address);
  if(foundPrice != -1) {
    prices[chain][foundPrice].price = priceData.price;
    prices[chain][foundPrice].source = priceData.source;
    prices[chain][foundPrice].timestamp = priceData.timestamp;
  } else {
    if(!priceData.symbol) {
      let foundToken: TokenData | TerraTokenData | undefined;
      if(chain != 'terra') {
        let data = getChainTokenData(chain);
        if(data) {
          foundToken = data.tokens.find(token => token.address.toLowerCase() === priceData.address.toLowerCase());
        }
      } else {
        foundToken = terra_data.tokens.find(token => token.address.toLowerCase() === priceData.address.toLowerCase());
      }
      if(foundToken) {
        priceData.symbol = foundToken.symbol;
      }
    }
    prices[chain].push(priceData);
  }
}

/* ========================================================================================================================================================================= */

// Function to redirect token price feeds where necessary:
const redirectTokenPriceFeed = async (chain: Chain, address: Address | TerraAddress) => {

  // Initializations:
  let tokenPrice = 0;

  // Redirecting Price Feed:
  switch(chain) {
    case 'eth':
      switch(address.toLowerCase()) {
        case '0x799a4202c12ca952cb311598a024c80ed371a41e': // ONE
          tokenPrice = await getTokenPrice('one', defaultAddress, 18);
          break;
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
          tokenPrice = await getTokenPrice('bsc', defaultAddress, 18);
          break;
      }
      break;
    case 'ftm':
      switch(address.toLowerCase()) {
        case '0x3d8f1accee8e263f837138829b6c4517473d0688': // fWINGS
          tokenPrice = await getTokenPrice('bsc', '0x0487b824c8261462f88940f97053e65bdb498446', 18);
          break;
      }
      break;
    case 'avax':
      switch(address.toLowerCase()) {
        // None yet.
      }
      break;
    case 'one':
      switch(address.toLowerCase()) {
        case '0x95ce547d730519a90def30d647f37d9e5359b6ae': // LUNA
          tokenPrice = await getTokenPrice('terra', defaultAddress);
          break;
        case '0x7a791e76bf4d4f3b9b492abb74e5108180be6b5a': // 1LINK
          tokenPrice = await getTokenPrice('eth', '0x514910771af9ca656af840dff83e8264ecf986ca', 18);
          break;
        case '0x352cd428efd6f31b5cae636928b7b84149cf369f': // 1CRV
          tokenPrice = await getTokenPrice('eth', '0xd533a949740bb3306d119cc777fa900ba034cd52', 18);
          break;
        case '0xeb6c08ccb4421b6088e581ce04fcfbed15893ac3': // 1FRAX
          tokenPrice = await getTokenPrice('eth', '0x853d955acef822db058eb8505911ed77f175b99e', 18);
          break;
      }
      break;
    case 'cronos':
      switch(address.toLowerCase()) {
        case '0xbed48612bc69fa1cab67052b42a95fb30c1bcfee': // SHIB
          tokenPrice = await getTokenPrice('eth', '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce', 18);
          break;
        case '0xb888d8dd1733d72681b30c00ee76bde93ae7aa93': // ATOM
          tokenPrice = await getTokenPrice('bsc', '0x0eb3a705fc54725037cc9e008bdede697f62f335', 18);
          break;
        case '0x1a8e39ae59e5556b56b76fcba98d22c9ae557396': // DOGE
          tokenPrice = await getTokenPrice('bsc', '0xba2ae424d960c26247dd6c32edc70b295c744c43', 8);
          break;
      }
      break;
    case 'terra':
      switch(address.toLowerCase()) {
        // None yet.
      }
      break;
  }

  // Updating Token Price:
  if(tokenPrice) {
    updatePrices(chain, {
      symbol: null,
      address: address.toLowerCase() as Address | TerraAddress,
      price: tokenPrice,
      source: 'proxy',
      timestamp: Date.now()
    });
  }
}