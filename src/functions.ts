
// Imports:
import { ethers } from 'ethers';
import { chains } from './chains';
import { projects } from './projects';
import { getTokenPrice } from './prices';
import { eth_data, bsc_data, poly_data, ftm_data, avax_data, one_data } from './tokens';
import { minABI, lpABI, traderjoe, aave, balancer, belt, alpaca, curve, bzx, iron, axial, mstable, cookiegame } from './ABIs';
import type { EVMChain, Address, URL, ABI, ENS, TokenData, TokenStatus, TokenType, NativeToken, Token, LPToken, DebtToken, XToken, PricedToken } from './types';

// Initializations:
const defaultTokenLogo: URL = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@d5c68edec1f5eaec59ac77ff2b48144679cebca1/32/icon/generic.png';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const zero: Address = '0x0000000000000000000000000000000000000000';
const maxQueryRetries = 3;

// Ignored Errors On Blockchain Queries:
export const ignoredErrors: { chain: EVMChain, address: Address }[] = [
  {chain: 'poly', address: '0x8aaa5e259f74c8114e0a471d9f2adfc66bfe09ed'}, // QuickSwap Registry
  {chain: 'poly', address: '0x9dd12421c637689c3fc6e661c9e2f02c2f61b3eb'}  // QuickSwap Dual Rewards Registry
];

/* ========================================================================================================================================================================= */

// Function to make blockchain queries:
export const query = async (chain: EVMChain, address: Address, abi: ABI[], method: string, args: any[]) => {
  let result;
  let errors = 0;
  let rpcID = 0;
  while(!result && errors < maxQueryRetries) {
    try {
      let ethers_provider = new ethers.providers.JsonRpcProvider(chains[chain].rpcs[rpcID]);
      let contract = new ethers.Contract(address, abi, ethers_provider);
      result = await contract[method](...args);
    } catch {
      if(++rpcID >= chains[chain].rpcs.length) {
        if(++errors >= maxQueryRetries) {
          if(!ignoredErrors.find(i => i.chain === chain && i.address === address.toLowerCase())) {
            console.error(`Error Calling ${method}(${args}) on ${address} (Chain: ${chain.toUpperCase()})`);
          }
        } else {
          rpcID = 0;
        }
      }
    }
  }
  return result;
}

/* ========================================================================================================================================================================= */

// Function to fetch wallet balances:
export const getWalletBalance = async (chain: EVMChain, wallet: Address) => {
  let walletBalance: (NativeToken | Token)[] = [];
  walletBalance.push(...(await getWalletNativeTokenBalance(chain, wallet)));
  walletBalance.push(...(await getWalletTokenBalance(chain, wallet)));
  return walletBalance;
}

/* ========================================================================================================================================================================= */

// Function to fetch project balances:
export const getProjectBalance = async (chain: EVMChain, wallet: Address, project: string) => {
  let projectBalance: (NativeToken | Token | LPToken | DebtToken | XToken)[] = [];
  if(projects[chain].includes(project)) {
    let dapp = await import(`./projects/${chain}/${project}`);
    let balance = await dapp.get(wallet);
    projectBalance.push(...(balance));
  } else {
    console.error(`Invalid Project Queried: ${project} (Chain: ${chain.toUpperCase()})`);
  }
  return projectBalance;
}

/* ========================================================================================================================================================================= */

// Function to check if a hash corresponds to a valid wallet address:
export const isWallet = async (address: Address) => {
  return ethers.utils.isAddress(address);
}

/* ========================================================================================================================================================================= */

// Function to get native token info:
export const addNativeToken = async (chain: EVMChain, rawBalance: number, owner: Address): Promise<NativeToken> => {

  // Initializing Token Values:
  let type: TokenType = 'nativeToken';
  let location = 'wallet';
  let status: TokenStatus = 'none';
  let address = defaultAddress;
  let decimals = 18;
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, defaultAddress, decimals);
  let symbol = '';

  // Finding Token Symbol:
  if(chain === 'bsc') {
    symbol = 'BNB';
  } else if(chain === 'poly') {
    symbol = 'MATIC';
  } else {
    symbol = chain.toUpperCase();
  }

  // Finding Token Logo:
  let logo = getTokenLogo(chain, symbol);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get token info:
export const addToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = '';
  let decimals = 18;
  let logo: URL;

  // Finding Token Info:
  if(address.toLowerCase() === defaultAddress) {
    if(chain === 'bsc') {
      symbol = 'BNB';
    } else if(chain === 'poly') {
      symbol = 'MATIC';
    } else {
      symbol = chain.toUpperCase();
    }
    logo = getTokenLogo(chain, symbol);
  } else {
    let token = getTrackedTokenInfo(chain, address);
    if(token) {
      symbol = token.symbol;
      decimals = token.decimals;
      logo = token.logo;
    } else {
      symbol = await query(chain, address, minABI, 'symbol', []);
      decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
      logo = getTokenLogo(chain, symbol);
    }
  }

  // Finding Missing Token Info:
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, address, decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get LP token info:
export const addLPToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<LPToken> => {

  // Initializing Token Values:
  let type: TokenType = 'lpToken';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let symbol0 = '';
  let symbol1 = '';
  let decimals0 = 18;
  let decimals1 = 18;

  // Finding LP Token Info:
  let lpTokenReserves = await query(chain, address, lpABI, 'getReserves', []);
  let lpTokenSupply = await query(chain, address, lpABI, 'totalSupply', []) / (10 ** decimals);
  let address0 = await query(chain, address, lpABI, 'token0', []);
  let address1 = await query(chain, address, lpABI, 'token1', []);
  let trackedToken0 = getTrackedTokenInfo(chain, address0);
  let trackedToken1 = getTrackedTokenInfo(chain, address1);
  if(trackedToken0) {
    symbol0 = trackedToken0.symbol;
    decimals0 = trackedToken0.decimals;
  } else {
    symbol0 = await query(chain, address0, minABI, 'symbol', []);
    decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
  }
  if(trackedToken1) {
    symbol1 = trackedToken1.symbol;
    decimals1 = trackedToken1.decimals;
  } else {
    symbol1 = await query(chain, address1, minABI, 'symbol', []);
    decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
  }
  let supply0 = lpTokenReserves[0] / (10 ** decimals0);
  let supply1 = lpTokenReserves[1] / (10 ** decimals1);

  // First Paired Token:
  let token0: PricedToken = {
    symbol: symbol0,
    address: address0,
    balance: (supply0 * (balance / lpTokenSupply)),
    price: await getTokenPrice(chain, address0, decimals0),
    logo: getTokenLogo(chain, symbol0)
  }

  // Second Paired Token:
  let token1: PricedToken = {
    symbol: symbol1,
    address: address1,
    balance: (supply1 * (balance / lpTokenSupply)),
    price: await getTokenPrice(chain, address1, decimals1),
    logo: getTokenLogo(chain, symbol1)
  }

  return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };
}

/* ========================================================================================================================================================================= */

// Function to get debt token info:
export const addDebtToken = async (chain: EVMChain, location: string, address: Address, rawBalance: number, owner: Address): Promise<DebtToken> => {

  // Initializing Token Values:
  let type: TokenType = 'debt';
  let status: TokenStatus = 'borrowed';
  let symbol = '';
  let decimals = 18;
  let logo: URL;

  // Finding Token Info:
  if(address.toLowerCase() === defaultAddress) {
    if(chain === 'bsc') {
      symbol = 'BNB';
    } else if(chain === 'poly') {
      symbol = 'MATIC';
    } else {
      symbol = chain.toUpperCase();
    }
    logo = getTokenLogo(chain, symbol);
  } else {
    let token = getTrackedTokenInfo(chain, address);
    if(token) {
      symbol = token.symbol;
      decimals = token.decimals;
      logo = token.logo;
    } else {
      symbol = await query(chain, address, minABI, 'symbol', []);
      decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
      logo = getTokenLogo(chain, symbol);
    }
  }

  // Finding Missing Token Info:
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, address, decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get derivative/composite token info:
export const addXToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address, underlyingAddress: Address, underlyingRawBalance: number): Promise<XToken> => {

  // Initializing Token Values:
  let type: TokenType = 'xToken';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let underlyingSymbol = '';
  let underlyingDecimals = 18;
  let underlyingLogo: URL;

  // Finding Token Logo:
  let logo = getTokenLogo(chain, symbol);

  // Finding Underlying Token Info:
  let token = getTrackedTokenInfo(chain, address);
  if(token) {
    underlyingSymbol = token.symbol;
    underlyingDecimals = token.decimals;
    underlyingLogo = token.logo;
  } else {
    underlyingSymbol = await query(chain, underlyingAddress, minABI, 'symbol', []);
    underlyingDecimals = parseInt(await query(chain, underlyingAddress, minABI, 'decimals', []));
    underlyingLogo = getTokenLogo(chain, underlyingSymbol);
  }

  // Underlying Token:
  let underlyingToken: PricedToken = {
    symbol: underlyingSymbol,
    address: underlyingAddress,
    balance: underlyingRawBalance / (10 ** underlyingDecimals),
    price: await getTokenPrice(chain, underlyingAddress, underlyingDecimals),
    logo: underlyingLogo
  }

  return { type, chain, location, status, owner, symbol, address, balance, logo, underlyingToken };
}

/* ========================================================================================================================================================================= */

// Function to get a list of tracked tokens on any given chain:
export const getTokens = (chain: EVMChain) => {
  let chainTokenData = getChainTokenData(chain);
  if(chainTokenData) {
    return chainTokenData.tokens;
  } else {
    return [];
  }
}

/* ========================================================================================================================================================================= */

// Function to select the right chain's token data:
export const getChainTokenData = (chain: EVMChain) => {
  switch(chain) {
    case 'eth':
      return eth_data;
    case 'bsc':
      return bsc_data;
    case 'poly':
      return poly_data;
    case 'ftm':
      return ftm_data;
    case 'avax':
      return avax_data;
    case 'one':
      return one_data;
    default:
      return undefined;
  }
}

/* ========================================================================================================================================================================= */

// Function to get a token's logo:
export const getTokenLogo = (chain: EVMChain, symbol: string) => {

  // Initializing Default Token Logo:
  let logo = defaultTokenLogo;

  // Selecting Token Data:
  let data = getChainTokenData(chain);

  // Finding Token Logo:
  if(data) {
    let trackedToken = data.tokens.find(token => token.symbol === symbol);
    if(trackedToken) {
      logo = trackedToken.logo;
    } else {
      let token = data.logos.find(i => i.symbol === symbol);
      if(token) {
        logo = token.logo;
      }
    }
  }

  return logo;
}

/* ========================================================================================================================================================================= */

// Function to resolve an ENS domain:
export const resolveENS = async (ens: ENS) => {
  let ethers_provider = new ethers.providers.JsonRpcProvider(chains['eth'].rpcs[0]);
  let address = await ethers_provider.resolveName(ens);
  if(address) {
    return address as Address;
  } else {
    return null;
  }
}

/* ========================================================================================================================================================================= */

// Function to reverse lookup an ENS domain:
export const lookupENS = async (address: Address) => {
  let ethers_provider = new ethers.providers.JsonRpcProvider(chains['eth'].rpcs[0]);
  let ens = await ethers_provider.lookupAddress(address);
  if(ens) {
    return ens as ENS;
  } else {
    return null;
  }
}

/* ========================================================================================================================================================================= */

// Function to get a wallet's native token balance:
const getWalletNativeTokenBalance = async (chain: EVMChain, wallet: Address) => {
  let balance;
  let errors = 0;
  let rpcID = 0;
  while(!balance && errors < maxQueryRetries) {
    try {
      let ethers_provider = new ethers.providers.JsonRpcProvider(chains[chain].rpcs[rpcID]);
      balance = parseInt((await ethers_provider.getBalance(wallet)).toString());
    } catch {
      if(++rpcID >= chains[chain].rpcs.length) {
        errors++;
        rpcID = 0;
      }
    }
  }
  if(balance && balance > 0) {
    let newToken = await addNativeToken(chain, balance, wallet);
    return [newToken];
  }
  return [];
}

/* ========================================================================================================================================================================= */

// Function to get a wallet's token balance:
const getWalletTokenBalance = async (chain: EVMChain, wallet: Address) => {
  let tokens: Token[] = [];
  let data = getChainTokenData(chain);
  if(data) {
    let promises = data.tokens.map(token => (async () => {
      let balance = parseInt(await query(chain, token.address, minABI, 'balanceOf', [wallet]));
      if(balance > 0) {
        let newToken = await addTrackedToken(chain, 'wallet', 'none', token, balance, wallet);
        tokens.push(newToken);
      }
    })());
    await Promise.all(promises);
  }
  return tokens;
}

/* ========================================================================================================================================================================= */

// Function to get tracked token info:
const getTrackedTokenInfo = (chain: EVMChain, address: Address) => {
  let data = getChainTokenData(chain);
  if(data) {
    return data.tokens.find(token => token.address.toLowerCase() === address.toLowerCase());
  } else {
    return undefined;
  }
}

/* ========================================================================================================================================================================= */

// Function to get tracked token info:
const addTrackedToken = async (chain: EVMChain, location: string, status: TokenStatus, token: TokenData, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let address = token.address;
  let symbol = token.symbol;
  let logo = token.logo;
  let decimals = token.decimals;
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, address, decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Trader Joe token info (xJOE):
export const addTraderJoeToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let underlyingToken = await query(chain, address, traderjoe.joeABI, 'joe', []);
  let joeStaked = parseInt(await query(chain, underlyingToken, minABI, 'balanceOf', [address]));
  let xjoeSupply = parseInt(await query(chain, address, minABI, 'totalSupply', []));
  let multiplier = joeStaked / xjoeSupply;
  let price = multiplier * (await getTokenPrice(chain, underlyingToken, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Aave BLP token info:
export const addAaveBLPToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<LPToken> => {

  // Initializing Token Values:
  let type: TokenType = 'lpToken';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  address = await query(chain, address, aave.lpABI, 'bPool', []);

  // Finding LP Token Info:
  let lpTokenSupply = await query(chain, address, balancer.tokenABI, 'totalSupply', []) / (10 ** decimals);
  let lpTokenAddresses = await query(chain, address, balancer.tokenABI, 'getCurrentTokens', []);
  let address0 = lpTokenAddresses[0];
  let address1 = lpTokenAddresses[1];
  let supply0 = await query(chain, address, balancer.tokenABI, 'getBalance', [address0]) / (10 ** decimals);
  let supply1 = await query(chain, address, balancer.tokenABI, 'getBalance', [address1]) / (10 ** decimals);
  let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
  let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
  let symbol0 = await query(chain, address0, minABI, 'symbol', []);
  let symbol1 = await query(chain, address1, minABI, 'symbol', []);

  // First Paired Token:
  let token0: PricedToken = {
    symbol: symbol0,
    address: address0,
    balance: supply0 * (balance / lpTokenSupply),
    price: await getTokenPrice(chain, address0, decimals0),
    logo: getTokenLogo(chain, symbol0)
  }

  // Second Paired Token:
  let token1: PricedToken = {
    symbol: symbol1,
    address: address1,
    balance: supply1 * (balance / lpTokenSupply),
    price: await getTokenPrice(chain, address1, decimals1),
    logo: getTokenLogo(chain, symbol1)
  }

  return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };
}

/* ========================================================================================================================================================================= */

// Function to get 4Belt token info:
export const add4BeltToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = '4Belt';
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);
  let price = 1;

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Belt token info:
export const addBeltToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let multiplier = parseInt(await query(chain, address, belt.tokenABI, 'getPricePerFullShare', [])) / (10 ** decimals);
  let underlyingToken = await query(chain, address, belt.tokenABI, 'token', []);
  let price = multiplier * (await getTokenPrice(chain, underlyingToken, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Alpaca token info:
export const addAlpacaToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let totalToken = parseInt(await query(chain, address, alpaca.tokenABI, 'totalToken', []));
  let totalSupply = parseInt(await query(chain, address, minABI, 'totalSupply', []));
  let multiplier = totalToken / totalSupply;
  let underlyingToken = await query(chain, address, alpaca.tokenABI, 'token', []);
  let price = multiplier * (await getTokenPrice(chain, underlyingToken, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Curve token info:
export const addCurveToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token | LPToken> => {
  
  // Ethereum Token:
  if(chain === 'eth') {

    // Generic Token Values:
    let registry: Address = '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5';
    let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
    let balance = rawBalance / (10 ** decimals);
    let symbol = await query(chain, address, minABI, 'symbol', []);
    let lpTokenSupply = await query(chain, address, minABI, 'totalSupply', []) / (10 ** decimals);
    let poolAddress = await query(chain, registry, curve.registryABI, 'get_pool_from_lp_token', [address]);
    let tokens = (await query(chain, registry, curve.registryABI, 'get_underlying_coins', [poolAddress])).filter((token: Address) => token != zero);
    let reserves = (await query(chain, registry, curve.registryABI, 'get_underlying_balances', [poolAddress])).filter((balance: number) => balance != 0);
    let multiplier = parseInt(await query(chain, registry, curve.registryABI, 'get_virtual_price_from_lp_token', [address])) / (10 ** decimals);

    // Function to redirect synthetic asset price fetching:
    const getPrice = async (chain: EVMChain, address: Address, decimals: number): Promise<number> => {
      if(address.toLowerCase() === '0xbBC455cb4F1B9e4bFC4B73970d360c8f032EfEE6'.toLowerCase()) { // sLINK
        return await getTokenPrice(chain, '0x514910771af9ca656af840dff83e8264ecf986ca', decimals);
      } else if(address.toLowerCase() === '0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6'.toLowerCase()) { // sBTC
        return await getTokenPrice(chain, '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', decimals);
      } else if(address.toLowerCase() === '0xd71ecff9342a5ced620049e616c5035f1db98620'.toLowerCase()) { // sEUR
        return await getTokenPrice(chain, '0xdb25f211ab05b1c97d595516f45794528a807ad8', decimals);
      } else {
        return await getTokenPrice(chain, address, decimals);
      }
    }

    // 3+ Asset Tokens:
    if(tokens.length > 2) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let price = 0;
      for(let i = 0; i < tokens.length; i++) {
        let tokenDecimals = parseInt(await query(chain, tokens[i], minABI, 'decimals', []));
        let tokenPrice = await getPrice(chain, tokens[i], tokenDecimals);
        price += (parseInt(reserves[i]) / (10 ** tokenDecimals)) * tokenPrice;
      }
      price /= lpTokenSupply;
      price *= multiplier;

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // Standard LP Tokens:
    } else if(tokens.length === 2) {

      // Initializing Token Values:
      let type: TokenType = 'lpToken';

      // Finding LP Token Info:
      let address0 = tokens[0];
      let address1 = tokens[1];
      let decimals0 = 18;
      let decimals1 = 18;
      let symbol0 = '';
      let symbol1 = '';
      if(tokens[0].toLowerCase() === defaultAddress) {
        symbol0 = 'ETH';
      } else {
        decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
        symbol0 = await query(chain, address0, minABI, 'symbol', []);
      }
      if(tokens[1].toLowerCase() === defaultAddress) {
        symbol1 = 'ETH';
      } else {
        decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
        symbol1 = await query(chain, address1, minABI, 'symbol', []);
      }

      // First Paired Token:
      let token0: PricedToken = {
        symbol: symbol0,
        address: address0,
        balance: (parseInt(reserves[0]) / (10 ** 18)) * (balance / lpTokenSupply),
        price: await getTokenPrice(chain, address0, decimals0),
        logo: getTokenLogo(chain, symbol0)
      }

      // Second Paired Token:
      let token1: PricedToken = {
        symbol: symbol1,
        address: address1,
        balance: (parseInt(reserves[1]) / (10 ** 18)) * (balance / lpTokenSupply),
        price: await getTokenPrice(chain, address1, decimals1),
        logo: getTokenLogo(chain, symbol1)
      }

      return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };
    }

  // Polygon Token:
  } else if(chain === 'poly') {

    // Generic Token Values:
    let symbol = await query(chain, address, minABI, 'symbol', []);
    let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
    let balance = rawBalance / (10 ** decimals);
    
    // crvUSDBTCETH (Atricrypto V3):
    if(address.toLowerCase() === '0xdAD97F7713Ae9437fa9249920eC8507e5FbB23d3'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let lpTokenSupply = await query(chain, address, minABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.polyTokenABI, 'minter', []);
      let multiplier = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);
      let address0 = await query(chain, minter, curve.minterABI, 'coins', [0]);
      let address1 = await query(chain, minter, curve.minterABI, 'coins', [1]);
      let address2 = await query(chain, minter, curve.minterABI, 'coins', [2]);
      let token0 = await query(chain, address0, curve.polyTokenABI, 'minter', []);
      let token1 = await query(chain, address1, curve.intermediaryABI, 'UNDERLYING_ASSET_ADDRESS', []);
      let token2 = await query(chain, address2, curve.intermediaryABI, 'UNDERLYING_ASSET_ADDRESS', []);
      let decimals0 = 18;
      let decimals1 = parseInt(await query(chain, token1, minABI, 'decimals', []));
      let decimals2 = parseInt(await query(chain, token2, minABI, 'decimals', []));
      let supply0 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [0])) / (10 ** decimals0);
      let supply1 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [1])) / (10 ** decimals1);
      let supply2 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [2])) / (10 ** decimals2);
      let price0 = parseInt(await query(chain, token0, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals0);
      let price1 = await getTokenPrice(chain, token1, decimals1);
      let price2 = await getTokenPrice(chain, token2, decimals2);
      let price = multiplier * (((supply0 * price0) + (supply1 * price1) + (supply2 * price2)) / lpTokenSupply);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // am3CRV (Aave):
    } else if(address.toLowerCase() === '0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let minter = await query(chain, address, curve.polyTokenABI, 'minter', []);
      let price = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // btcCRV (Ren):
    } else if(address.toLowerCase() === '0xf8a57c1d3b9629b77b6726a042ca48990A84Fb49'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'lpToken';

      // Finding LP Token Info:
      let lpTokenSupply = await query(chain, address, lpABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.polyTokenABI, 'minter', []);
      let address0 = await query(chain, minter, curve.minterABI, 'underlying_coins', [0]);
      let address1 = await query(chain, minter, curve.minterABI, 'underlying_coins', [1]);
      let symbol0 = await query(chain, address0, minABI, 'symbol', []);
      let symbol1 = await query(chain, address1, minABI, 'symbol', []);
      let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
      let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
      let supply0 = await query(chain, minter, curve.minterABI, 'balances', [0]) / (10 ** decimals);
      let supply1 = await query(chain, minter, curve.minterABI, 'balances', [1]) / (10 ** decimals);

      // First Paired Token:
      let token0: PricedToken = {
        symbol: symbol0,
        address: address0,
        balance: (supply0 * (balance / lpTokenSupply)) / (10 ** decimals0),
        price: await getTokenPrice(chain, address0, decimals0),
        logo: getTokenLogo(chain, symbol0)
      }

      // Second Paired Token:
      let token1: PricedToken = {
        symbol: symbol1,
        address: address1,
        balance: (supply1 * (balance / lpTokenSupply)) / (10 ** decimals1),
        price: await getTokenPrice(chain, address1, decimals1),
        logo: getTokenLogo(chain, symbol1)
      }

      return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };

    // crvEURTUSD (EURtUSD):
    } else if(address.toLowerCase() === '0x600743B1d8A96438bD46836fD34977a00293f6Aa'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let lpTokenSupply = await query(chain, address, minABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.polyTokenABI, 'minter', []);
      let multiplier = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);
      let token0 = await query(chain, minter, curve.minterABI, 'coins', [0]);
      let address1 = await query(chain, minter, curve.minterABI, 'coins', [1]);
      let token1 = await query(chain, address1, curve.polyTokenABI, 'minter', []);
      let decimals0 = parseInt(await query(chain, token0, minABI, 'decimals', []));
      let decimals1 = 18;
      let supply0 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [0])) / (10 ** decimals0);
      let supply1 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [1])) / (10 ** decimals1);
      let price0 = await getTokenPrice(chain, token0, decimals0);
      let price1 = parseInt(await query(chain, token1, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals1);
      let price = multiplier * (((supply0 * price0) + (supply1 * price1)) / lpTokenSupply);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };
    }

  // Fantom Token:
  } else if(chain === 'ftm') {

    // Generic Token Values:
    let symbol = await query(chain, address, minABI, 'symbol', []);
    let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
    let balance = rawBalance / (10 ** decimals);
    
    // DAI+USDC (2pool):
    if(address.toLowerCase() === '0x27E611FD27b276ACbd5Ffd632E5eAEBEC9761E40'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'lpToken';

      // Finding LP Token Info:
      let lpTokenSupply = await query(chain, address, lpABI, 'totalSupply', []) / (10 ** decimals);
      let address0 = await query(chain, address, curve.ftmTokenABI, 'coins', [0]);
      let address1 = await query(chain, address, curve.ftmTokenABI, 'coins', [1]);
      let symbol0 = await query(chain, address0, minABI, 'symbol', []);
      let symbol1 = await query(chain, address1, minABI, 'symbol', []);
      let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
      let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
      let supply0 = await query(chain, address, curve.ftmTokenABI, 'balances', [0]) / (10 ** decimals);
      let supply1 = await query(chain, address, curve.ftmTokenABI, 'balances', [1]) / (10 ** decimals);

      // First Paired Token:
      let token0: PricedToken = {
        symbol: symbol0,
        address: address0,
        balance: (supply0 * (balance / lpTokenSupply)) / (10 ** decimals0),
        price: await getTokenPrice(chain, address0, decimals0),
        logo: getTokenLogo(chain, symbol0)
      }

      // Second Paired Token:
      let token1: PricedToken = {
        symbol: symbol1,
        address: address1,
        balance: (supply1 * (balance / lpTokenSupply)) / (10 ** decimals1),
        price: await getTokenPrice(chain, address1, decimals1),
        logo: getTokenLogo(chain, symbol1)
      }

      return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };

    // fUSDT+DAI+USDC (fUSDT):
    } else if(address.toLowerCase() === '0x92D5ebF3593a92888C25C0AbEF126583d4b5312E'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);
      symbol = 'fUSDTCRV';

      // Finding Token Price:
      let price = parseInt(await query(chain, address, curve.ftmTokenABI, 'get_virtual_price', [])) / (10 ** decimals);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // btcCRV (Ren):
    } else if(address.toLowerCase() === '0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'lpToken';

      // Finding LP Token Info:
      let lpTokenSupply = await query(chain, address, lpABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.ftmTokenABI, 'minter', []);
      let address0 = await query(chain, minter, curve.minterABI, 'coins', [0]);
      let address1 = await query(chain, minter, curve.minterABI, 'coins', [1]);
      let symbol0 = await query(chain, address0, minABI, 'symbol', []);
      let symbol1 = await query(chain, address1, minABI, 'symbol', []);
      let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
      let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
      let supply0 = await query(chain, minter, curve.minterABI, 'balances', [0]) / (10 ** decimals);
      let supply1 = await query(chain, minter, curve.minterABI, 'balances', [1]) / (10 ** decimals);

      // First Paired Token:
      let token0: PricedToken = {
        symbol: symbol0,
        address: address0,
        balance: (supply0 * (balance / lpTokenSupply)) / (10 ** decimals0),
        price: await getTokenPrice(chain, address0, decimals0),
        logo: getTokenLogo(chain, symbol0)
      }

      // Second Paired Token:
      let token1: PricedToken = {
        symbol: symbol1,
        address: address1,
        balance: (supply1 * (balance / lpTokenSupply)) / (10 ** decimals1),
        price: await getTokenPrice(chain, address1, decimals1),
        logo: getTokenLogo(chain, symbol1)
      }

      return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };

    // crv3crypto (Tricrypto):
    } else if(address.toLowerCase() === '0x58e57cA18B7A47112b877E31929798Cd3D703b0f'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let lpTokenSupply = await query(chain, address, minABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.ftmTokenABI, 'minter', []);
      let multiplier = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);
      let token0 = await query(chain, minter, curve.minterABI, 'coins', [0]);
      let token1 = await query(chain, minter, curve.minterABI, 'coins', [1]);
      let token2 = await query(chain, minter, curve.minterABI, 'coins', [2]);
      let decimals0 = parseInt(await query(chain, token0, minABI, 'decimals', []));
      let decimals1 = parseInt(await query(chain, token1, minABI, 'decimals', []));
      let decimals2 = parseInt(await query(chain, token2, minABI, 'decimals', []));
      let supply0 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [0])) / (10 ** decimals0);
      let supply1 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [1])) / (10 ** decimals1);
      let supply2 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [2])) / (10 ** decimals2);
      let price0 = await getTokenPrice(chain, token0, decimals0);
      let price1 = await getTokenPrice(chain, token1, decimals1);
      let price2 = await getTokenPrice(chain, token2, decimals2);
      let price = multiplier * (((supply0 * price0) + (supply1 * price1) + (supply2 * price2)) / lpTokenSupply);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // g3CRV (Geist):
    } else if(address.toLowerCase() === '0xD02a30d33153877BC20e5721ee53DeDEE0422B2F'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let minter = await query(chain, address, curve.ftmTokenABI, 'minter', []);
      let price = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };
    }

  // Avalanche Token:
  } else if(chain === 'avax') {

    // Generic Token Values:
    let symbol = await query(chain, address, minABI, 'symbol', []);
    let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
    let balance = rawBalance / (10 ** decimals);
    
    // crvUSDBTCETH (Atricrypto V2):
    if(address.toLowerCase() === '0x1daB6560494B04473A0BE3E7D83CF3Fdf3a51828'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let lpTokenSupply = await query(chain, address, minABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.avaxTokenABI, 'minter', []);
      let multiplier = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);
      let address0 = await query(chain, minter, curve.minterABI, 'coins', [0]);
      let address1 = await query(chain, minter, curve.minterABI, 'coins', [1]);
      let address2 = await query(chain, minter, curve.minterABI, 'coins', [2]);
      let token0 = await query(chain, address0, curve.avaxTokenABI, 'minter', []);
      let token1 = await query(chain, address1, curve.intermediaryABI, 'UNDERLYING_ASSET_ADDRESS', []);
      let token2 = await query(chain, address2, curve.intermediaryABI, 'UNDERLYING_ASSET_ADDRESS', []);
      let decimals0 = 18;
      let decimals1 = parseInt(await query(chain, token1, minABI, 'decimals', []));
      let decimals2 = parseInt(await query(chain, token2, minABI, 'decimals', []));
      let supply0 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [0])) / (10 ** decimals0);
      let supply1 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [1])) / (10 ** decimals1);
      let supply2 = parseInt(await query(chain, minter, curve.minterABI, 'balances', [2])) / (10 ** decimals2);
      let price0 = parseInt(await query(chain, token0, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals0);
      let price1 = await getTokenPrice(chain, token1, decimals1);
      let price2 = await getTokenPrice(chain, token2, decimals2);
      let price = multiplier * (((supply0 * price0) + (supply1 * price1) + (supply2 * price2)) / lpTokenSupply);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // am3CRV (Aave):
    } else if(address.toLowerCase() === '0x1337BedC9D22ecbe766dF105c9623922A27963EC'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'token';
      let logo = getTokenLogo(chain, symbol);

      // Finding Token Price:
      let minter = await query(chain, address, curve.avaxTokenABI, 'minter', []);
      let price = parseInt(await query(chain, minter, curve.minterABI, 'get_virtual_price', [])) / (10 ** decimals);

      return { type, chain, location, status, owner, symbol, address, balance, price, logo };

    // btcCRV (Ren):
    } else if(address.toLowerCase() === '0xC2b1DF84112619D190193E48148000e3990Bf627'.toLowerCase()) {

      // Initializing Token Values:
      let type: TokenType = 'lpToken';

      // Finding LP Token Info:
      let lpTokenSupply = await query(chain, address, lpABI, 'totalSupply', []) / (10 ** decimals);
      let minter = await query(chain, address, curve.avaxTokenABI, 'minter', []);
      let address0 = await query(chain, minter, curve.minterABI, 'underlying_coins', [0]);
      let address1 = await query(chain, minter, curve.minterABI, 'underlying_coins', [1]);
      let symbol0 = await query(chain, address0, minABI, 'symbol', []);
      let symbol1 = await query(chain, address1, minABI, 'symbol', []);
      let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
      let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
      let supply0 = await query(chain, minter, curve.minterABI, 'balances', [0]) / (10 ** decimals);
      let supply1 = await query(chain, minter, curve.minterABI, 'balances', [1]) / (10 ** decimals);

      // First Paired Token:
      let token0: PricedToken = {
        symbol: symbol0,
        address: address0,
        balance: (supply0 * (balance / lpTokenSupply)) / (10 ** decimals0),
        price: await getTokenPrice(chain, address0, decimals0),
        logo: getTokenLogo(chain, symbol0)
      }

      // Second Paired Token:
      let token1: PricedToken = {
        symbol: symbol1,
        address: address1,
        balance: (supply1 * (balance / lpTokenSupply)) / (10 ** decimals1),
        price: await getTokenPrice(chain, address1, decimals1),
        logo: getTokenLogo(chain, symbol1)
      }

      return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };
    }
  }

  // No Token Identified:
  console.warn(`Unidentified Curve Token: ${address}`);
  return {
    type: 'token',
    chain: chain,
    location: location,
    status: 'none',
    owner: owner,
    symbol: '???',
    address: address,
    balance: 0,
    price: 0,
    logo: defaultTokenLogo
  }
}

/* ========================================================================================================================================================================= */

// Function to get BZX token info:
export const addBZXToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let multiplier = parseInt(await query(chain, address, bzx.tokenABI, 'tokenPrice', [])) / (10 ** decimals);
  let underlyingToken = await query(chain, address, bzx.tokenABI, 'loanTokenAddress', []);
  let price = multiplier * (await getTokenPrice(chain, underlyingToken, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Balancer LP token info:
export const addBalancerToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address, id: Address) => {
  return await addBalancerLikeToken(chain, location, status, address, rawBalance, owner, id, '0xBA12222222228d8Ba445958a75a0704d566BF2C8');
}

// Function to get Balancer-like LP token info:
export const addBalancerLikeToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address, id: Address, vault: Address): Promise<Token | LPToken> => {

  // Generic Token Values:
  let poolInfo = await query(chain, vault, balancer.vaultABI, 'getPoolTokens', [id]);
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let lpTokenSupply = parseInt(await query(chain, address, minABI, 'totalSupply', []));

  // 3+ Asset Tokens:
  if(poolInfo.tokens.length > 2) {

    // Initializing Token Values:
    let type: TokenType = 'token';
    let logo = getTokenLogo(chain, symbol);

    // Finding Token Price:
    let priceSum = 0;
    for(let i = 0; i < poolInfo.tokens.length; i++) {
      let tokenDecimals = parseInt(await query(chain, poolInfo.tokens[i], minABI, 'decimals', []));
      let tokenPrice = await getTokenPrice(chain, poolInfo.tokens[i], tokenDecimals);
      priceSum += (parseInt(poolInfo.balances[i]) / (10 ** tokenDecimals)) * tokenPrice;
    }
    let price = priceSum / (lpTokenSupply / (10 ** decimals));

    return { type, chain, location, status, owner, symbol, address, balance, price, logo };

  // Standard LP Tokens:
  } else if(poolInfo.tokens.length === 2) {

    // Initializing Token Values:
    let type: TokenType = 'lpToken';

    // Finding LP Token Info:
    let address0 = poolInfo.tokens[0];
    let address1 = poolInfo.tokens[1];
    let symbol0 = await query(chain, address0, minABI, 'symbol', []);
    let symbol1 = await query(chain, address1, minABI, 'symbol', []);
    let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
    let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));

    // First Paired Token:
    let token0: PricedToken = {
      symbol: symbol0,
      address: address0,
      balance: (parseInt(poolInfo.balances[0]) * (balance / lpTokenSupply)) / (10 ** decimals0),
      price: await getTokenPrice(chain, address0, decimals0),
      logo: getTokenLogo(chain, symbol0)
    }

    // Second Paired Token:
    let token1: PricedToken = {
      symbol: symbol1,
      address: address1,
      balance: (parseInt(poolInfo.balances[1]) * (balance / lpTokenSupply)) / (10 ** decimals1),
      price: await getTokenPrice(chain, address1, decimals1),
      logo: getTokenLogo(chain, symbol1)
    }

    return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };
  }

  // No Token Identified:
  return {
    type: 'token',
    chain: chain,
    location: location,
    status: 'none',
    owner: owner,
    symbol: '???',
    address: address,
    balance: 0,
    price: 0,
    logo: defaultTokenLogo
  }
}

/* ========================================================================================================================================================================= */

// Function to get Iron token info:
export const addIronToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let swapAddress = await query(chain, address, iron.tokenABI, 'swap', []);
  let price = parseInt(await query(chain, swapAddress, iron.swapABI, 'getVirtualPrice', [])) / (10 ** decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Axial token info:
export const addAxialToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let swapAddress = await query(chain, address, axial.tokenABI, 'owner', []);
  let price = parseInt(await query(chain, swapAddress, axial.swapABI, 'getVirtualPrice', [])) / (10 ** decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get mStable token info:
export const addStableToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = defaultTokenLogo;

  // Finding Token Price:
  let price = parseInt((await query(chain, address, mstable.stableABI, 'getPrice', [])).price) / (10 ** decimals);

  // Finding Token Symbol:
  logo = price > 1000 ? getTokenLogo(chain, 'mBTC') : getTokenLogo(chain, 'mUSD');

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Cookie token info:
export const addCookieToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let fortunePrice = await getTokenPrice(chain, '0xd8187f630A93A1d841dbBC99cd5fe06587A984DE', 9);
  let exchangeRate = parseInt(await query(chain, '0x9eE8817Fe46f4620708a9FA1119972bC4c131641', cookiegame.exchangeABI, 'price', []));
  let price = fortunePrice / exchangeRate;

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Alligator token info (xGTR):
export const addAlligatorToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let gtr: Address = '0x43c812ba28cb061b1be7514145a15c9e18a27342';
  let gtrStaked = parseInt(await query(chain, gtr, minABI, 'balanceOf', [address]));
  let xgtrSupply = parseInt(await query(chain, address, minABI, 'totalSupply', []));
  let multiplier = gtrStaked / xgtrSupply;
  let price = multiplier * (await getTokenPrice(chain, gtr, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}