
// Imports:
import { projects } from './projects';
import { terra_data } from './tokens';
import { getTokenPrice } from './prices';
import { Pagination } from '@terra-money/terra.js/dist/client/lcd/APIRequester';
import { Coin, Coins, LCDClient, AccPubKey, Delegation } from '@terra-money/terra.js';
import type { Chain, Address, TerraAddress, URL, TokenStatus, TokenType, NativeToken, Token, LPToken, DebtToken, XToken, PricedToken } from './types';

// Initializations:
const chain: Chain = 'terra';
const defaultTokenLogo: URL = 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@d5c68edec1f5eaec59ac77ff2b48144679cebca1/32/icon/generic.png';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
const nativeTokenSymbols: string[] = ['aud', 'cad', 'chf', 'cny', 'dkk', 'eur', 'gbp', 'hkd', 'idr', 'inr', 'jpy', 'krw', 'mnt', 'php', 'sdr', 'sek', 'sgd', 'thb', 'usd', 'myr', 'twd'];

// Setting Up Blockchain Connection:
const terra = new LCDClient({ URL: "https://lcd.terra.dev", chainID: "columbus-5" });

/* ========================================================================================================================================================================= */

// Function to make blockchain queries:
export const query = async (address: TerraAddress, query: any): Promise<any> => {
  try {
    let result = await terra.wasm.contractQuery(address, query);
    return result;
  } catch {
    console.error(`Calling ${JSON.stringify(query)} on ${address} (Chain: TERRA)`);
  }
};

/* ========================================================================================================================================================================= */

// Function to fetch wallet balances:
export const getWalletBalance = async (wallet: TerraAddress) => {
  let walletBalance: (NativeToken | Token)[] = [];
  walletBalance.push(...(await getWalletNativeTokenBalance(wallet)));
  walletBalance.push(...(await getWalletTokenBalance(wallet)));
  return walletBalance;
}

/* ========================================================================================================================================================================= */

// Function to fetch project balances:
export const getProjectBalance = async (wallet: TerraAddress, project: string) => {
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
export const isWallet = (address: TerraAddress) => {
  try {
    AccPubKey.fromAccAddress(address);
    return true;
  } catch {
    return false;
  }
}

/* ========================================================================================================================================================================= */

// Function to get native token info:
export const addNativeToken = async (location: string, status: TokenStatus, rawBalance: number, owner: TerraAddress, denom: string): Promise<NativeToken> => {

  // Initializing Token Values:
  let type: TokenType = 'nativeToken';
  let address = defaultAddress;
  let balance = rawBalance / (10 ** 6);
  let symbol = denom.slice(1, -1) + 't';

  // Finding Token Price:
  let price = await getTokenPrice(chain, defaultAddress + symbol as Address);

  // Correcting Token Symbol:
  if(symbol != 'luna') {
    if(nativeTokenSymbols.includes(symbol)) {
      symbol = symbol.slice(0, -1) + 't';
    } else {
      console.error(`TERRA: Native Token Symbol Not Found - ${symbol}`);
    }
  }
  symbol = symbol.toUpperCase();

  // Finding Token Logo:
  let logo = getTokenLogo(symbol);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get native debt token info:
export const addNativeDebtToken = async (location: string, status: TokenStatus, rawBalance: number, owner: TerraAddress, denom: string): Promise<DebtToken> => {

  // Initializing Token Values:
  let nativeToken = await addNativeToken(location, status, rawBalance, owner, denom);
  let symbol = nativeToken.symbol;
  let address = nativeToken.address;
  let balance = nativeToken.balance;
  let price = nativeToken.price;
  let logo = nativeToken.logo;

  // Setting Token Type:
  let type: TokenType = 'debt';

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
};

/* ========================================================================================================================================================================= */

// Function to get token info:
export const addToken = async (location: string, status: TokenStatus, address: TerraAddress, symbol: string, decimals: number, rawBalance: number, owner: TerraAddress): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, address);
  let logo = getTokenLogo(symbol);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get LP token info:
export const addLPToken = async (location: string, status: TokenStatus, address: TerraAddress, rawBalance: number, owner: TerraAddress, symbol?: string): Promise<LPToken> => {
  
  // Initializing Token Values:
  let type: TokenType = 'lpToken';
  let pairInfo = await query(address, { pair: {} });
  let poolInfo = await query(address, { pool: {} });
  let lpTokenInfo = await query(pairInfo.liquidity_token, { token_info: {} });
  let decimals = parseInt(lpTokenInfo.decimals);
  let balance = rawBalance / (10 ** decimals);
  let totalShares = parseInt(poolInfo.total_share);

  // First Paired Token:
  let type0: TokenType = pairInfo.asset_infos[0].hasOwnProperty('token') ? 'token' : 'nativeToken';
  let rawBalance0: number = rawBalance * parseInt(poolInfo.assets[0].amount) / totalShares;
  let token0 = await (type0 === 'token' ? addPricedToken(pairInfo.asset_infos[0].token.contract_addr, rawBalance0) : addNativePricedToken(rawBalance0, pairInfo.asset_infos[0].native_token.denom));

  // Second Paired Token:
  let type1: TokenType = pairInfo.asset_infos[1].hasOwnProperty('token') ? 'token' : 'nativeToken';
  let rawBalance1: number = rawBalance * parseInt(poolInfo.assets[1].amount) / totalShares;
  let token1 = await (type1 === 'token' ? addPricedToken(pairInfo.asset_infos[1].token.contract_addr, rawBalance1) : addNativePricedToken(rawBalance1, pairInfo.asset_infos[1].native_token.denom));

  // Finding LP Symbol If Necessary:
  if(!symbol) {
    symbol = `${token0.symbol}-${token1.symbol} LP`;
  }

  return { type, chain, location, status, owner, symbol, address, balance, token0, token1 };
}

/* ========================================================================================================================================================================= */

// Function to get token info:
export const addDebtToken = async (location: string, address: TerraAddress, symbol: string, decimals: number, rawBalance: number, owner: TerraAddress): Promise<DebtToken> => {

  // Initializing Token Values:
  let type: TokenType = 'debt';
  let status: TokenStatus = 'borrowed';
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, address);
  let logo = getTokenLogo(symbol);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get a list of tracked tokens:
export const getTokens = () => {
  return terra_data.tokens;
}

/* ========================================================================================================================================================================= */

// Function to get a wallet's native token balance:
const getWalletNativeTokenBalance = async (wallet: TerraAddress) => {

  // Initializations:
  let balances: NativeToken[] = [];
  let ignoreTokens = ['unok', 'uidr'];
  let bankBalances: Coin[] = [];
  let stakingDelegations: Delegation[] = [];
  let firstQuery = true;
  let pageKey: string | null = null;

  // Bank Balances:
  while(firstQuery || pageKey) {
    let results: [Coins, Pagination] = await terra.bank.balance(wallet, (pageKey ? { "pagination.key": pageKey } : undefined));
    pageKey = results[1].next_key;
    bankBalances.push(...results[0].filter((token: any) => token.denom.charAt(0) === 'u' && !ignoreTokens.includes(token.denom.toLowerCase())));
    firstQuery = false;
  }

  // LUNA Staking Delegations:
  firstQuery = true;
  pageKey = null;
  while (firstQuery || pageKey) {
    let results: [Delegation[], Pagination] = await terra.staking.delegations(wallet, undefined, (pageKey ? { "pagination.key": pageKey } : undefined));
    pageKey = results[1].next_key;
    stakingDelegations.push(...results[0]);
    firstQuery = false;
  }

  // Delegation Rewards:
  let rewards = (await terra.distribution.rewards(wallet)).total.filter(coin => coin.denom.charAt(0) === 'u' && !ignoreTokens.includes(coin.denom.toLowerCase()));
  
  // Adding Tokens:
  let promises = [
    ...bankBalances.map((token: Coin) => (async () => {
      balances.push(await addNativeToken('wallet', 'none', token.amount.toNumber(), wallet, token.denom.slice(1)));
    })()),
    ...stakingDelegations.map((delegation) => (async () => {
      balances.push(await addNativeToken('staking_luna', 'staked', delegation.balance.amount.toNumber(), wallet, delegation.balance.denom.slice(1)));
    })()),
    ...rewards.map((token: Coin) => (async () => {
      balances.push(await addNativeToken('staking_luna', 'unclaimed', token.amount.toNumber(), wallet, token.denom.slice(1)));
    })())
  ];
  await Promise.all(promises);

  return balances;
}

/* ========================================================================================================================================================================= */

// Function to get a wallet's token balance:
const getWalletTokenBalance = async (wallet: TerraAddress) => {
  let tokens: Token[] = [];
  let promises = terra_data.tokens.map(token => (async () => {
    let balance = parseInt((await query(token.address, { balance: { address: wallet } })).balance);
    if(balance > 0) {
      let newToken = await addToken('wallet', 'none', token.address, token.symbol, token.decimals, balance, wallet);
      tokens.push(newToken);
    }
  })());
  await Promise.all(promises);
  return tokens;
}

/* ========================================================================================================================================================================= */

// Function to get a token's logo:
const getTokenLogo = (symbol: string) => {

  // Initializing Default Token Logo:
  let logo = defaultTokenLogo;

  // Finding Token Logo:
  let trackedToken = terra_data.tokens.find(token => token.symbol === symbol);
  if(trackedToken) {
    logo = trackedToken.logo;
  } else {
    let token = terra_data.logos.find(i => i.symbol === symbol);
    if(token) {
      logo = token.logo;
    }
  }

  return logo;
}

/* ========================================================================================================================================================================= */

// Underlying LP Token Helper Function:
const addNativePricedToken = async (rawBalance: number, denom: string): Promise<PricedToken> => {

  // Finding Underlying Token Info:
  let nativeToken = await addNativeToken('', 'none', rawBalance, 'terra1', denom.slice(1));
  let symbol = nativeToken.symbol;
  let address = defaultAddress;
  let balance = nativeToken.balance;
  let price = nativeToken.price;
  let logo = nativeToken.logo;

  return { symbol, address, balance, price, logo }
}

/* ========================================================================================================================================================================= */

// Underlying LP Token Helper Function:
const addPricedToken = async (address: TerraAddress, rawBalance: number): Promise<PricedToken> => {

  // Finding Underlying Token Info:
  let { symbol, decimals } = await query(address, { token_info: {} });
  let balance = rawBalance / (10 ** decimals);
  let price = await getTokenPrice(chain, address);
  let logo = getTokenLogo(symbol);

  return { symbol, address, balance, price, logo }
}