
// Imports:
import { WeaverError } from './error';
import { getTokenPrice } from './prices';
import { query, multicallOneContractQuery, multicallOneMethodQuery, addXToken, getTokenLogo, defaultTokenLogo, parseBN, zero } from './functions';
import { minABI, lpABI, aave, balancer, belt, alpaca, curve, bzx, iron, axial, mstable } from './ABIs';

// Type Imports:
import type { EVMChain, Address, Hash, TokenStatus, TokenType, Token, LPToken, PricedToken, CallContext } from './types';

/* ========================================================================================================================================================================= */

// Function to get Trader Joe token info (xJOE):
export const addTraderJoeToken = async (chain: EVMChain, location: string, status: TokenStatus, rawBalance: number, owner: Address) => {
  const xjoe: Address = '0x57319d41F71E81F3c65F2a47CA4e001EbAFd4F33';
  const joe: Address = '0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd';
  let joeStaked = parseInt(await query(chain, joe, minABI, 'balanceOf', [xjoe]));
  let xjoeSupply = parseInt(await query(chain, xjoe, minABI, 'totalSupply', []));
  let newToken = await addXToken(chain, location, status, xjoe, rawBalance, owner, joe, rawBalance * (joeStaked / xjoeSupply));
  return newToken;
}

/* ========================================================================================================================================================================= */

// Function to get Belt token info (beltBTC, beltETH, etc.):
export const addBeltToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address) => {
  let exchangeRate = parseInt(await query(chain, address, belt.tokenABI, 'getPricePerFullShare', [])) / (10 ** 18);
  let underlyingToken: Address = await query(chain, address, belt.tokenABI, 'token', []);
  let newToken = await addXToken(chain, location, status, address, rawBalance, owner, underlyingToken, rawBalance * exchangeRate);
  return newToken;
}

/* ========================================================================================================================================================================= */

// Function to get SpookySwap token info (xBOO):
export const addSpookyToken = async (chain: EVMChain, location: string, status: TokenStatus, rawBalance: number, owner: Address) => {
  const xboo: Address = '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598';
  const boo: Address = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';
  let booStaked = parseInt(await query(chain, boo, minABI, 'balanceOf', [xboo]));
  let xbooSupply = parseInt(await query(chain, xboo, minABI, 'totalSupply', []));
  let newToken = await addXToken(chain, location, status, xboo, rawBalance, owner, boo, rawBalance * (booStaked / xbooSupply));
  return newToken;
}

/* ========================================================================================================================================================================= */

// Function to get Aave BLP token info:
export const addAaveBLPToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<LPToken> => {

  // Initializing Token Values:
  let type: TokenType = 'lpToken';
  let symbol: string = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  address = await query(chain, address, aave.lpABI, 'bPool', []);

  // Finding LP Token Info:
  let lpTokenSupply = await query(chain, address, minABI, 'totalSupply', []) / (10 ** decimals);
  let lpTokenAddresses: Address[] = await query(chain, address, balancer.tokenABI, 'getCurrentTokens', []);
  let address0 = lpTokenAddresses[0];
  let address1 = lpTokenAddresses[1];
  let supply0 = await query(chain, address, balancer.tokenABI, 'getBalance', [address0]) / (10 ** decimals);
  let supply1 = await query(chain, address, balancer.tokenABI, 'getBalance', [address1]) / (10 ** decimals);
  let decimals0 = parseInt(await query(chain, address0, minABI, 'decimals', []));
  let decimals1 = parseInt(await query(chain, address1, minABI, 'decimals', []));
  let symbol0: string = await query(chain, address0, minABI, 'symbol', []);
  let symbol1: string = await query(chain, address1, minABI, 'symbol', []);

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
  let decimals = 18;
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);
  let price = 1;

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Alpaca token info:
export const addAlpacaToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol: string = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let totalToken = parseInt(await query(chain, address, alpaca.tokenABI, 'totalToken', []));
  let totalSupply = parseInt(await query(chain, address, minABI, 'totalSupply', []));
  let multiplier = totalToken / totalSupply;
  let underlyingToken: Address = await query(chain, address, alpaca.tokenABI, 'token', []);
  let price = multiplier * (await getTokenPrice(chain, underlyingToken, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Curve token info:
export const addCurveToken = async (chain: EVMChain, location: string, status: TokenStatus, lpToken: Address, rawBalance: number, owner: Address): Promise<Token | LPToken> => {

  // Initializations:
  const addressProvider: Address = '0x0000000022D53366457F9d5E68Ec105046FC4383';
  let registry: 'base' | 'crypto' | 'factory' = 'base';
  let poolAddress: Address;
  let poolMultiplier: number;
  let poolInfo: { coin: Address, decimals: number, balance: number, underlyingCoin?: Address, underlyingDecimals?: number, underlyingBalance?: number }[] = [];
  
  // Initializing Multicalls:
  const providerCalls: CallContext[] = [
    { reference: 'registry', methodName: 'get_address', methodParameters: [0] },
    { reference: 'poolInfoGetter', methodName: 'get_address', methodParameters: [1] },
    { reference: 'factoryRegistry', methodName: 'get_address', methodParameters: [3] },
    { reference: 'cryptoRegistry', methodName: 'get_address', methodParameters: [5] }
  ];
  const lpCalls: CallContext[] = [
    { reference: 'symbol', methodName: 'symbol', methodParameters: [] },
    { reference: 'decimals', methodName: 'decimals', methodParameters: [] },
    { reference: 'totalSupply', methodName: 'totalSupply', methodParameters: [] }
  ];
  
  // Fetching Addresses:
  let providerMulticallResults = await multicallOneContractQuery(chain, addressProvider, curve.providerABI, providerCalls);
  let baseRegistry: Address = providerMulticallResults['registry'][0];
  let poolInfoGetter: Address = providerMulticallResults['poolInfoGetter'][0];
  let factoryRegistry: Address = providerMulticallResults['factoryRegistry'][0];
  let cryptoRegistry: Address = providerMulticallResults['cryptoRegistry'][0];
  
  // Fetching LP Token Info:
  let lpMulticallResults = await multicallOneContractQuery(chain, lpToken, lpABI, lpCalls);
  let symbol: string = lpMulticallResults['symbol'][0];
  let decimals: number = lpMulticallResults['decimals'][0];
  let totalSupply = parseBN(lpMulticallResults['totalSupply'][0]) / (10 ** decimals);
  let balance = rawBalance / (10 ** decimals);

  // Finding Pool Address & Multiplier:
  poolAddress = await query(chain, baseRegistry, curve.registryABI, 'get_pool_from_lp_token', [lpToken]);
  if(poolAddress == zero) {
    poolAddress = await query(chain, cryptoRegistry, curve.registryABI, 'get_pool_from_lp_token', [lpToken]);
    registry = 'crypto';
    if(poolAddress == zero) {
      poolAddress = lpToken;
      registry = 'factory';
    }
  }

  // Fetching Pool Info From CryptoRegistry:
  if(registry === 'crypto') {
    let registryCalls: CallContext[] = [
      { reference: 'multiplier', methodName: 'get_virtual_price_from_lp_token', methodParameters: [lpToken] },
      { reference: 'coins', methodName: 'get_coins', methodParameters: [poolAddress] },
      { reference: 'balances', methodName: 'get_balances', methodParameters: [poolAddress] },
      { reference: 'decimals', methodName: 'get_decimals', methodParameters: [poolAddress] }
    ];
    let registryMulticallResults = await multicallOneContractQuery(chain, cryptoRegistry, curve.cryptoRegistryABI, registryCalls);
    poolMultiplier = parseBN(registryMulticallResults['multiplier'][0]) / (10 ** decimals);
    let coins: Address[] = registryMulticallResults['coins'].filter((coin: Address) => coin != zero);
    let coinBalances: string[] = registryMulticallResults['balances'];
    let coinDecimals: string[] = registryMulticallResults['decimals'];
    for(let i = 0; i < coins.length; i++) {
      poolInfo.push({
        coin: coins[i],
        decimals: parseBN(coinDecimals[i]),
        balance: parseBN(coinBalances[i])
      });
    }
    
  // Fetching Pool Info From Factory:
  } else if(registry === 'factory') {
    let coins: Address[] = (await query(chain, factoryRegistry, curve.factoryABI, 'get_coins', [poolAddress])).filter((coin: Address) => coin != zero);
    if(coins.length > 0) {
      poolMultiplier = 1;
      let isMetaPool: boolean = await query(chain, factoryRegistry, curve.factoryABI, 'is_meta', [poolAddress]);
      if(isMetaPool) {
        let factoryCalls: CallContext[] = [
          { reference: 'underlyingCoins', methodName: 'get_underlying_coins', methodParameters: [poolAddress] },
          { reference: 'underlyingBalances', methodName: 'get_underlying_balances', methodParameters: [poolAddress] },
          { reference: 'underlyingDecimals', methodName: 'get_underlying_decimals', methodParameters: [poolAddress] }
        ];
        let factoryMulticallResults = await multicallOneContractQuery(chain, factoryRegistry, curve.factoryABI, factoryCalls);
        let underlyingCoins: Address[] = factoryMulticallResults['underlyingCoins'].filter((coin: Address) => coin != zero);
        let underlyingBalances: string[] = factoryMulticallResults['underlyingBalances'];
        let underlyingDecimals: string[] = factoryMulticallResults['underlyingDecimals'];
        for(let i = 0; i < underlyingCoins.length; i++) {
          poolInfo.push({
            coin: underlyingCoins[i],
            decimals: parseBN(underlyingDecimals[i]),
            balance: parseBN(underlyingBalances[i])
          });
        }
      } else {
        let factoryCalls: CallContext[] = [
          { reference: 'balances', methodName: 'get_balances', methodParameters: [poolAddress] },
          { reference: 'decimals', methodName: 'get_decimals', methodParameters: [poolAddress] }
        ];
        let factoryMulticallResults = await multicallOneContractQuery(chain, factoryRegistry, curve.factoryABI, factoryCalls);
        let coinBalances: string[] = factoryMulticallResults['balances'];
        let coinDecimals: string[] = factoryMulticallResults['decimals'];
        for(let i = 0; i < coins.length; i++) {
          poolInfo.push({
            coin: coins[i],
            decimals: parseBN(coinDecimals[i]),
            balance: parseBN(coinBalances[i])
          });
        }
      }
    } else {
      throw new WeaverError(chain, null, `Unidentified Curve pool found`);
    }

  // Fetching Pool Info From Registry & PoolInfoGetter:
  } else {
    poolMultiplier = parseInt(await query(chain, baseRegistry, curve.registryABI, 'get_virtual_price_from_lp_token', [lpToken])) / (10 ** decimals);
    let getterCalls: CallContext[] = [
      { reference: 'coins', methodName: 'get_pool_coins', methodParameters: [poolAddress] },
      { reference: 'info', methodName: 'get_pool_info', methodParameters: [poolAddress] }
    ];
    let getterMulticallResults = await multicallOneContractQuery(chain, poolInfoGetter, curve.poolInfoGetterABI, getterCalls);
    let coins: Address[] = getterMulticallResults['coins'][0].filter((coin: Address) => coin != zero);
    let underlyingCoins: Address[] = getterMulticallResults['coins'][1];
    let coinDecimals: string[] = getterMulticallResults['coins'][2];
    let underlyingDecimals: string[] = getterMulticallResults['coins'][3];
    let coinBalances: string[] = getterMulticallResults['info'][0];
    let underlyingBalances: string[] = getterMulticallResults['info'][1];
    for(let i = 0; i < coins.length; i++) {
      poolInfo.push({
        coin: coins[i],
        decimals: parseBN(coinDecimals[i]),
        balance: parseBN(coinBalances[i]),
        underlyingCoin: underlyingCoins[i],
        underlyingDecimals: parseBN(underlyingDecimals[i]),
        underlyingBalance: parseBN(underlyingBalances[i])
      });
    }
  }

  // Standard LP Tokens:
  if(poolInfo.length === 2) {

    // Initializing Token Values:
    let type: TokenType = 'lpToken';
    let address0 = poolInfo[0].underlyingCoin ??= poolInfo[0].coin;
    let address1 = poolInfo[1].underlyingCoin  ??= poolInfo[1].coin;
    let supply0 = poolInfo[0].underlyingBalance ??= poolInfo[0].balance;
    let supply1 = poolInfo[1].underlyingBalance ??= poolInfo[1].balance;
    let decimals0 = poolInfo[0].underlyingDecimals ??= poolInfo[0].decimals;
    let decimals1 = poolInfo[1].underlyingDecimals ??= poolInfo[1].decimals;

    // Fetching Underlying Token Symbols:
    let multicallResults = await multicallOneMethodQuery(chain, [address0, address1], minABI, 'symbol', []);
    let symbol0: string = multicallResults[address0][0];
    let symbol1: string = multicallResults[address1][0];

    // First Paired Token:
    let token0: PricedToken = {
      symbol: symbol0,
      address: address0,
      balance: (supply0 / (10 ** decimals0)) * (balance / totalSupply),
      price: await getTokenPrice(chain, address0, decimals0),
      logo: getTokenLogo(chain, symbol0)
    }

    // Second Paired Token:
    let token1: PricedToken = {
      symbol: symbol1,
      address: address1,
      balance: (supply1 / (10 ** decimals1)) * (balance / totalSupply),
      price: await getTokenPrice(chain, address1, decimals1),
      logo: getTokenLogo(chain, symbol1)
    }

    return { type, chain, location, status, owner, symbol, address: lpToken, balance, token0, token1 };

  // Other:
  } else {

    // Initializing Token Values:
    let type: TokenType = 'token';

    // Fetching Token Logo:
    let logo = getTokenLogo(chain, symbol);

    // Calculating Token Price:
    let price = 0;
    for(let i = 0; i < poolInfo.length; i++) {
      let address = poolInfo[i].underlyingCoin ??= poolInfo[i].coin;
      let supply = poolInfo[i].underlyingBalance ??= poolInfo[i].balance;
      let decimals = poolInfo[i].underlyingDecimals ??= poolInfo[i].decimals;
      let tokenPrice = await getTokenPrice(chain, address, decimals);
      price += (supply / (10 ** decimals)) * tokenPrice;
    }
    price /= totalSupply;
    price *= poolMultiplier;

    return { type, chain, location, status, owner, symbol, address: lpToken, balance, price, logo };
  }
}

/* ========================================================================================================================================================================= */

// Function to get BZX token info:
export const addBZXToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol: string = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let multiplier = parseInt(await query(chain, address, bzx.tokenABI, 'tokenPrice', [])) / (10 ** decimals);
  let underlyingToken: Address = await query(chain, address, bzx.tokenABI, 'loanTokenAddress', []);
  let price = multiplier * (await getTokenPrice(chain, underlyingToken, decimals));

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Balancer LP token info:
export const addBalancerToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address) => {
  return await addBalancerLikeToken(chain, location, status, address, rawBalance, owner, '0xBA12222222228d8Ba445958a75a0704d566BF2C8');
}

// Function to get Balancer-like LP token info:
export const addBalancerLikeToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address, vault: Address): Promise<Token | LPToken> => {

  // Initializing Multicalls:
  const tokenCalls: CallContext[] = [
    { reference: 'poolID', methodName: 'getPoolId', methodParameters: [] },
    { reference: 'symbol', methodName: 'symbol', methodParameters: [] },
    { reference: 'decimals', methodName: 'decimals', methodParameters: [] },
    { reference: 'totalSupply', methodName: 'totalSupply', methodParameters: [] }
  ];
  const underlyingCalls: CallContext[] = [
    { reference: 'symbol', methodName: 'symbol', methodParameters: [] },
    { reference: 'decimals', methodName: 'decimals', methodParameters: [] }
  ];

  // Generic Token Values:
  let multicallResults = await multicallOneContractQuery(chain, address, minABI.concat(balancer.poolABI), tokenCalls);
  let poolID: Hash = multicallResults['poolID'][0];
  let symbol: string = multicallResults['symbol'][0];
  let decimals: number = multicallResults['decimals'][0];
  let lpTokenSupply = parseBN(multicallResults['totalSupply'][0]);
  let balance = rawBalance / (10 ** decimals);

  // Finding Pool Info:
  let poolInfo: { tokens: Address[], balances: string[] } = await query(chain, vault, balancer.vaultABI, 'getPoolTokens', [poolID]);

  // Standard LP Tokens:
  if(poolInfo.tokens.length === 2) {

    // Initializing Token Values:
    let type: TokenType = 'lpToken';

    // Finding LP Token Info:
    let address0 = poolInfo.tokens[0];
    let address1 = poolInfo.tokens[1];
    let token0MulticallResults = await multicallOneContractQuery(chain, address0, minABI, underlyingCalls);
    let symbol0: string = token0MulticallResults['symbol'][0];
    let decimals0: number = token0MulticallResults['decimals'][0];
    let token1MulticallResults = await multicallOneContractQuery(chain, address1, minABI, underlyingCalls);
    let symbol1: string = token1MulticallResults['symbol'][0];
    let decimals1: number = token1MulticallResults['decimals'][0];

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

  // Others:
  } else {

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
  }
}

/* ========================================================================================================================================================================= */

// Function to get Iron token info:
export const addIronToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol: string = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let swapAddress: Address = await query(chain, address, iron.tokenABI, 'swap', []);
  let price = parseInt(await query(chain, swapAddress, iron.swapABI, 'getVirtualPrice', [])) / (10 ** decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get Axial token info:
export const addAxialToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol: string = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = getTokenLogo(chain, symbol);

  // Finding Token Price:
  let swapAddress: Address = await query(chain, address, axial.tokenABI, 'owner', []);
  let price = parseInt(await query(chain, swapAddress, axial.swapABI, 'getVirtualPrice', [])) / (10 ** decimals);

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}

/* ========================================================================================================================================================================= */

// Function to get mStable token info:
export const addStableToken = async (chain: EVMChain, location: string, status: TokenStatus, address: Address, rawBalance: number, owner: Address): Promise<Token> => {

  // Initializing Token Values:
  let type: TokenType = 'token';
  let symbol: string = await query(chain, address, minABI, 'symbol', []);
  let decimals = parseInt(await query(chain, address, minABI, 'decimals', []));
  let balance = rawBalance / (10 ** decimals);
  let logo = defaultTokenLogo;

  // Finding Token Price:
  let price = parseInt((await query(chain, address, mstable.stableABI, 'getPrice', [])).price) / (10 ** decimals);

  // Finding Token Symbol:
  logo = price > 1000 ? getTokenLogo(chain, 'mBTC') : getTokenLogo(chain, 'mUSD');

  return { type, chain, location, status, owner, symbol, address, balance, price, logo };
}