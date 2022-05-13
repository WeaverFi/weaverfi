
// Type Imports:
import type { ABI } from './types';

/* ========================================================================================================================================================================= */

// General-Purpose Minimal ABI:
export const minABI: ABI[] = [
  { constant: true, inputs: [{ name: "", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
  { constant: true, inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], type: "function" },
  { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
  { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" }
];

// General-Purpose LP Token ABI:
export const lpABI: ABI[] = [
  { constant: true, inputs: [{ name: "", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
  { constant: true, inputs: [], name: "symbol", outputs: [{ name: "", type: "string" }], type: "function" },
  { constant: true, inputs: [], name: "decimals", outputs: [{ name: "", type: "uint8" }], type: "function" },
  { constant: true, inputs: [], name: "token0", outputs: [{ name: "", type: "address" }], type: "function" },
  { constant: true, inputs: [], name: "token1", outputs: [{ name: "", type: "address" }], type: "function" },
  { constant: true, inputs: [], name: "getReserves", outputs: [{ name: "", type: "uint112" }, { name: "", type: "uint112" }, { name: "", type: "uint32" }], type: "function" },
  { constant: true, inputs: [], name: "totalSupply", outputs: [{ name: "", type: "uint256" }], type: "function" }
];

/* ========================================================================================================================================================================= */

// Aave ABIs:
type aaveABIs = 'staking' | 'incentives' | 'lp' | 'lending' | 'uiDataProvider' | 'dataProvider';
export const aave: Record<`${aaveABIs}ABI`, ABI[]> = {
  stakingABI: [
    { constant: true, inputs: [], name: "STAKED_TOKEN", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  incentivesABI: [
    { constant: true, inputs: [{ name: "_user", type: "address" }], name: "getUserUnclaimedRewards", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "assets", type: "address[]" }, { name: "user", type: "address" }, { name: "reward", type: "address" }], name: "getUserRewards", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  lpABI: [
    { constant: true, inputs: [], name: "bPool", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  lendingABI: [
    { constant: true, inputs: [], name: "UNDERLYING_ASSET_ADDRESS", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  uiDataProviderABI: [
    { constant: true, inputs: [{ name: "provider", type: "address" }], name: "getReservesList", outputs: [{ name: "", type: "address[]" }], type: "function" }
  ],
  dataProviderABI: [
    { constant: true, inputs: [{ name: "asset", type: "address" }, { name: "user", type: "address" }], name: "getUserReserveData", outputs: [{ name: "currentATokenBalance", type: "uint256" }, { name: "currentStableDebt", type: "uint256" }, { name: "currentVariableDebt", type: "uint256" }, { name: "principalStableDebt", type: "uint256" }, { name: "scaledVariableDebt", type: "uint256" }, { name: "stableBorrowRate", type: "uint256" }, { name: "liquidityRate", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "asset", type: "address" }], name: "getReserveData", outputs: [{ name: "unbacked", type: "uint256" }, { name: "accruedToTreasuryScaled", type: "uint256" }, { name: "totalAToken", type: "uint256" }, { name: "totalStableDebt", type: "uint256" }, { name: "totalVariableDebt", type: "uint256" }, { name: "liquidityRate", type: "uint256" }, { name: "variableBorrowRate", type: "uint256" }, { name: "stableBorrowRate", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "asset", type: "address" }], name: "getReserveTokensAddresses", outputs: [{ name: "aTokenAddress", type: "address" }, { name: "stableDebtTokenAddress", type: "address" }, { name: "variableDebtTokenAddress", type: "address" }], type: "function" }
  ]
}

// Balancer ABIs:
type balancerABIs = 'token' | 'vault' | 'pool';
export const balancer: Record<`${balancerABIs}ABI`, ABI[]> = {
  tokenABI: [
    { constant: true, inputs: [], name: "getCurrentTokens", outputs: [{ name: "", type: "address[]" }], type: "function" },
    { constant: true, inputs: [{ name: "token", type: "address" }], name: "getBalance", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  vaultABI: [
    { constant: true, inputs: [{ name: "poolId", type: "bytes32" }], name: "getPool", outputs: [{ name: "", type: "address" }, { name: "", type: "uint8" }], type: "function" },
    { constant: true, inputs: [{ name: "poolId", type: "bytes32" }], name: "getPoolTokens", outputs: [{ name: "tokens", type: "address[]" }, { name: "balances", type: "uint256[]" }], type: "function" }
  ],
  poolABI: [
    { constant: true, inputs: [], name: "getPoolId", outputs: [{ name: "", type: "bytes32" }], type: "function" }
  ]
}

// Beethovenx ABIs:
type beethovenxABIs = 'masterChef';
export const beethovenx: Record<`${beethovenxABIs}ABI`, ABI[]> = {
  masterChefABI: [
    { constant: true, name: "lpTokens", inputs: [{ name: "", type: "uint256" }], outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, name: "pendingBeets", inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], outputs: [{ name: "pending", type: "uint256" }], type: "function" },
    { constant: true, name: "poolLength", inputs: [], outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, name: "userInfo", inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
  ]
}

// Snowball ABIs:
type snowballABIs = 'gauge' | 'farm' | 'staking';
export const snowball: Record<`${snowballABIs}ABI`, ABI[]> = {
  gaugeABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  farmABI: [
    { constant: true, inputs: [], name: "getRatio", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "token", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "arg0", type: "address" }], name: "locked", outputs: [{ name: "amount", type: "uint128" }, { name: "end", type: "uint256" }], type: "function" }
  ]
}

// Trader Joe ABIs:
type traderjoeABIs = 'masterChef' | 'bankController' | 'market';
export const traderjoe: Record<`${traderjoeABIs}ABI`, ABI[]> = {
  masterChefABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTimestamp", type: "uint256" }, { name: "accJoePerShare", type: "uint256" }, { name: "rewarder", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingTokens", outputs: [{ name: "pendingJoe", type: "uint256" }, { name: "bonusTokenAddress", type: "address" }, { name: "bonusTokenSymbol", type: "string" }, { name: "pendingBonusToken", type: "uint256" }], type: "function" }
  ],
  bankControllerABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" }
  ],
  marketABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountSnapshot", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" }
  ]
}

// PancakeSwap ABIs:
type pancakeswapABIs = 'registry' | 'autoCakePool';
export const pancakeswap: Record<`${pancakeswapABIs}ABI`, ABI[]> = {
  registryABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardBlock", type: "uint256" }, { name: "accCakePerShare", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingCake", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "lpToken", outputs: [{ name: "", type: "address" }], type: "function" },
  ],
  autoCakePoolABI: [
    { constant: true, inputs: [{ name: "", type: "address" }], name: "userInfo", outputs: [{ name: "shares", type: "uint256" }, { name: "lastDepositedTime", type: "uint256" }, { name: "cakeAtLastUserAction", type: "uint256" }, { name: "lastUserActionTime", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Lydia ABIs:
type lydiaABIs = 'registry' | 'lydFarm' | 'maximusFarm';
export const lydia: Record<`${lydiaABIs}ABI`, ABI[]> = {
  registryABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTimestamp", type: "uint256" }, { name: "accLydPerShare", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingLyd", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  lydFarmABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "sharesOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  maximusFarmABI: [
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// AutoFarm ABIs:
type autofarmABIs = 'registry' | 'pendingRewards' | 'oneRegistry';
export const autofarm: Record<`${autofarmABIs}ABI`, ABI[]> = {
  registryABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "stakedWantTokens", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }], name: "poolInfo", outputs: [{ name: "want", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardBlock", type: "uint256" }, { name: "accAUTOPerShare", type: "uint256" }, { name: "strat", type: "address" }], type: "function" }
  ],
  pendingRewardsABI: [
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingAUTO", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  oneRegistryABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "lpToken", outputs: [{ name: "", type: "address" }], type: "function" }
  ]
}

// Belt ABIs:
type beltABIs = 'masterBelt' | 'token' | 'staking';
export const belt: Record<`${beltABIs}ABI`, ABI[]> = {
  masterBeltABI: [
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "stakedWantTokens", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingBELT", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  tokenABI: [
    { constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "token", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "userAddr", type: "address" }], name: "getUserLockUpEndTime", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Alpaca ABIs:
type alpacaABIs = 'token';
export const alpaca: Record<`${alpacaABIs}ABI`, ABI[]> = {
  tokenABI: [
    { constant: true, inputs: [], name: "token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "totalToken", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Curve ABIs:
type curveABIs = 'provider' | 'registry' | 'cryptoRegistry' | 'factory' | 'poolInfoGetter' | 'gauge';
export const curve: Record<`${curveABIs}ABI`, ABI[]> = {
  providerABI: [
    { constant: true, inputs: [{ name: "_id", type: "uint256" }], name: "get_address", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  registryABI: [
    { constant: true, inputs: [], name: "pool_count", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "uint256" }], name: "pool_list", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "uint256" }], name: "get_lp_token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_gauges", outputs: [{ name: "", type: "address[10]" }, { name: "", type: "int128[10]" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "address" }], name: "get_pool_from_lp_token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_underlying_coins", outputs: [{ name: "", type: "address[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_underlying_balances", outputs: [{ name: "", type: "uint256[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_token", type: "address" }], name: "get_virtual_price_from_lp_token", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  cryptoRegistryABI: [
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_coins", outputs: [{ name: "", type: "address[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_balances", outputs: [{ name: "", type: "uint256[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_decimals", outputs: [{ name: "", type: "uint256[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_token", type: "address" }], name: "get_virtual_price_from_lp_token", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  factoryABI: [
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_gauge", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "is_meta", outputs: [{ name: "", type: "bool" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_coins", outputs: [{ name: "", type: "address[4]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_balances", outputs: [{ name: "", type: "uint256[4]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_decimals", outputs: [{ name: "", type: "uint256[4]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_underlying_coins", outputs: [{ name: "", type: "address[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_underlying_balances", outputs: [{ name: "", type: "uint256[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_underlying_decimals", outputs: [{ name: "", type: "uint256[8]" }], type: "function" }
  ],
  poolInfoGetterABI: [
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_pool_coins", outputs: [{ name: "coins", type: "address[8]" }, { name: "underlying_coins", type: "address[8]" }, { name: "decimals", type: "uint256[8]" }, { name: "underlying_decimals", type: "uint256[8]" }], type: "function" },
    { constant: true, inputs: [{ name: "_pool", type: "address" }], name: "get_pool_info", outputs: [{ name: "balances", type: "uint256[8]" }, { name: "underlying_balances", type: "uint256[8]" }, { name: "decimals", type: "uint256[8]" }, { name: "underlying_decimals", type: "uint256[8]" }, { name: "rates", type: "uint256[8]" }, { name: "lp_token", type: "address" }], type: "function" }
  ],
  gaugeABI: [
    { constant: true, inputs: [], name: "lp_token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "uint256" }], name: "reward_tokens", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_addr", type: "address" }, { name: "_token", type: "address" }], name: "claimable_reward", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// BZX ABIs:
type bzxABIs = 'token';
export const bzx: Record<`${bzxABIs}ABI`, ABI[]> = {
  tokenABI: [
    { constant: true, inputs: [], name: "loanTokenAddress", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "tokenPrice", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Compound ABIs:
type compoundABIs = 'controller' | 'market';
export const compound: Record<`${compoundABIs}ABI`, ABI[]> = {
  controllerABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" }
  ],
  marketABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountSnapshot", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" }
  ]
}

// Yearn ABIs:
type yearnABIs = 'deployer' | 'vault' | 'token';
export const yearn: Record<`${yearnABIs}ABI`, ABI[]> = {
  deployerABI: [
    { constant: true, inputs: [], name: "numTokens", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "uint256" }], name: "tokens", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "address" }], name: "numVaults", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "arg0", type: "address" }, { name: "arg1", type: "uint256" }], name: "vaults", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  vaultABI: [
    { constant: true, inputs: [], name: "token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "pricePerShare", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  tokenABI: [
    { constant: true, inputs: [], name: "token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Venus ABIs:
type venusABIs = 'controller' | 'market' | 'vault' | 'xvsVault';
export const venus: Record<`${venusABIs}ABI`, ABI[]> = {
  controllerABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "address" }], name: "venusAccrued", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  marketABI: [
    { constant: true, inputs: [], name: "exchangeRateStored", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "borrowBalanceStored", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  vaultABI: [
    { constant: true, inputs: [{ name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_user", type: "address" }], name: "pendingXVS", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  xvsVaultABI: [
    { constant: true, inputs: [{ name: "_rewardToken", type: "address" }, { name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "getUserInfo", outputs: [{ name: "amount", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_rewardToken", type: "address" }, { name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingReward", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Iron ABIs:
type ironABIs = 'registry' | 'lending' | 'market' | 'staking' | 'token' | 'swap';
export const iron: Record<`${ironABIs}ABI`, ABI[]> = {
  registryABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "lpToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingReward", outputs: [{ name: "pending", type: "uint256" }], type: "function" }
  ],
  lendingABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "address" }], name: "rewardAccrued", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  marketABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountSnapshot", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "<input>", type: "address" }], name: "locked", outputs: [{ name: "amount", type: "uint128" }, { name: "end", type: "uint256" }], type: "function" }
  ],
  tokenABI: [
    { constant: true, inputs: [], name: "swap", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  swapABI: [
    { constant: true, inputs: [], name: "getVirtualPrice", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// SpookySwap ABIs:
type spookyswapABIs = 'masterChef';
export const spookyswap: Record<`${spookyswapABIs}ABI`, ABI[]> = {
  masterChefABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTime", type: "uint256" }, { name: "accBOOPerShare", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingBOO", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Beefy ABIs:
type beefyABIs = 'vault' | 'staking';
export const beefy: Record<`${beefyABIs}ABI`, ABI[]> = {
  vaultABI: [
		{ constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "want", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Wault ABIs:
type waultABIs = 'master';
export const wault: Record<`${waultABIs}ABI`, ABI[]> = {
  masterABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
		{ constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }, { name: "pendingRewards", type: "uint256" }], type: "function" },
		{ constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardBlock", type: "uint256" }, { name: "accWexPerShare", type: "uint256" }], type: "function" }
  ]
}

// Quickswap ABIs:
type quickswapABIs = 'registry' | 'dualRegistry' | 'farm' | 'dualFarm' | 'staking';
export const quickswap: Record<`${quickswapABIs}ABI`, ABI[]> = {
  registryABI: [
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "stakingTokens", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "address" }], name: "stakingRewardsInfoByStakingToken", outputs: [{ name: "stakingRewards", type: "address" }, { name: "rewardAmount", type: "uint256" }, { name: "duration", type: "uint256" }], type: "function" }
  ],
  dualRegistryABI: [
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "stakingTokens", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "address" }], name: "stakingRewardsInfoByStakingToken", outputs: [{ name: "stakingRewards", type: "address" }, { name: "rewardsTokenA", type: "address" }, { name: "rewardsTokenB", type: "address" }, { name: "rewardAmountA", type: "uint256" }, { name: "rewardAmountB", type: "uint256" }, { name: "duration", type: "uint256" }], type: "function" }
  ],
  farmABI: [
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  dualFarmABI: [
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earnedA", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earnedB", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "_dQuickAmount", type: "uint256" }], name: "dQUICKForQUICK", outputs: [{ name: "quickAmount_", type: "uint256" }], type: "function" }
  ]
}

// BenQi ABIs:
type benqiABIs = 'controller' | 'market';
export const benqi: Record<`${benqiABIs}ABI`, ABI[]> = {
  controllerABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" }
  ],
  marketABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountSnapshot", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" }
  ]
}

// Axial ABIs:
type axialABIs = 'masterChef' | 'token' | 'swap';
export const axial: Record<`${axialABIs}ABI`, ABI[]> = {
  masterChefABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "accAxialPerShare", type: "uint256" }, { name: "lastRewardTimestamp", type: "uint256" }, { name: "allocPoint", type: "uint256" }, { name: "rewarder", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingTokens", outputs: [{ name: "pendingAxial", type: "uint256" }, { name: "bonusTokenAddress", type: "address" }, { name: "bonusTokenSymbol", type: "string" }, { name: "pendingBonusToken", type: "uint256" }], type: "function" }
  ],
  tokenABI: [
    { constant: true, inputs: [], name: "owner", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  swapABI: [
    { constant: true, inputs: [], name: "getVirtualPrice", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// mStable ABIs:
type mstableABIs = 'asset' | 'vault' | 'staking' | 'mbpt' | 'stable';
export const mstable: Record<`${mstableABIs}ABI`, ABI[]> = {
  assetABI: [
    { constant: true, inputs: [], name: "exchangeRate", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  vaultABI: [
    { constant: true, inputs: [{ name: "_account", type: "address" }], name: "rawBalanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "_account", type: "address" }], name: "rawBalanceOf", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "STAKED_TOKEN", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  mbptABI: [
    { constant: true, inputs: [], name: "getPoolId", outputs: [{ name: "", type: "bytes32" }], type: "function" }
  ],
  stableABI: [
    { constant: true, inputs: [], name: "getPrice", outputs: [{ name: "price", type: "uint256" }, { name: "k", type: "uint256" }], type: "function" }
  ]
}

// Penguin ABIs:
type penguinABIs = 'master' | 'nest';
export const penguin: Record<`${penguinABIs}ABI`, ABI[]> = {
  masterABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }], name: "poolInfo", outputs: [{ name: "poolToken", type: "address" }, { name: "rewarder", type: "address" }, { name: "strategy", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTime", type: "uint256" }, { name: "accPEFIPerShare", type: "uint256" }, { name: "withdrawFeeBP", type: "uint16" }, { name: "totalShares", type: "uint256" }, { name: "lpPerShare", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "pid", type: "uint256" }, { name: "user", type: "address" }], name: "pendingTokens", outputs: [{ name: "", type: "address[]" }, { name: "", type: "uint256[]" }], type: "function" },
    { constant: true, inputs: [{ name: "pid", type: "uint256" }, { name: "penguin", type: "address" }], name: "totalPendingPEFI", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  nestABI: [
    { constant: true, inputs: [], name: "currentExchangeRate", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Scream ABIs:
type screamABIs = 'controller' | 'market' | 'staking';
export const scream: Record<`${screamABIs}ABI`, ABI[]> = {
  controllerABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" }
  ],
  marketABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountSnapshot", outputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }, { name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [], name: "getShareValue", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Cycle ABIs:
type cycleABIs = 'distributor' | 'vault' | 'intermediary' | 'staking';
export const cycle: Record<`${cycleABIs}ABI`, ABI[]> = {
  distributorABI: [
    { constant: true, inputs: [], name: "getVaultRewardsCount", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "", type: "uint256" }], name: "rewards", outputs: [{ name: "StakingRewards", type: "address" }, { name: "weight", type: "uint256" }], type: "function" }
  ],
  vaultABI: [
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  intermediaryABI: [
    { constant: true, inputs: [], name: "LPtoken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountLP", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "shares", type: "uint256" }], name: "getLPamountForShares", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "getAccountCYCLE", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Teddy ABIs:
type teddyABIs = 'trove' | 'stabilityPool' | 'staking';
export const teddy: Record<`${teddyABIs}ABI`, ABI[]> = {
  troveABI: [
    { constant: true, inputs: [{ name: "", type: "address" }], name: "Troves", outputs: [{ name: "debt", type: "uint256" }, { name: "coll", type: "uint256" }, { name: "stake", type: "uint256" }, { name: "status", type: "uint8" }, { name: "arrayIndex", type: "uint128" }], type: "function" }
  ],
  stabilityPoolABI: [
    { constant: true, inputs: [{ name: "", type: "address" }], name: "deposits", outputs: [{ name: "initialValue", type: "uint256" }, { name: "frontEndTag", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_depositor", type: "address" }], name: "getDepositorETHGain", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_depositor", type: "address" }], name: "getDepositorLQTYGain", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "", type: "address" }], name: "stakes", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_user", type: "address" }], name: "getPendingETHGain", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_user", type: "address" }], name: "getPendingLUSDGain", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Everest ABIs:
type everestABIs = 'farm' | 'staking';
export const everest: Record<`${everestABIs}ABI`, ABI[]> = {
  farmABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "stakingToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "currentExchangeRate", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// ApeSwap ABIs:
type apeswapABIs = 'masterApe' | 'polyMasterApe' | 'rewarder' | 'vaultMaster';
export const apeswap: Record<`${apeswapABIs}ABI`, ABI[]> = {
  masterApeABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardBlock", type: "uint256" }, { name: "accCakePerShare", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingCake", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  polyMasterApeABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "lpToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingBanana", outputs: [{ name: "pending", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "rewarder", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  rewarderABI: [
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingToken", outputs: [{ name: "pending", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "rewardToken", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  vaultMasterABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "stakedWantTokens", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "want", type: "address" }, { name: "strat", type: "address" }], type: "function" }
  ]
}

// SushiSwap ABIs:
type sushiswapABIs = 'masterChef';
export const sushiswap: Record<`${sushiswapABIs}ABI`, ABI[]> = {
  masterChefABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "lpToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingSushi", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// YieldYak ABIs:
type yieldyakABIs = 'farm' | 'staking';
export const yieldyak: Record<`${yieldyakABIs}ABI`, ABI[]> = {
  farmABI: [
    { constant: true, inputs: [], name: "depositToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "totalDeposits", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardTokenDebt", type: "uint256" }], type: "function" }
  ]
}

// CREAM ABIs:
type creamABIs = 'controller' | 'token' | 'staking';
export const cream: Record<`${creamABIs}ABI`, ABI[]> = {
  controllerABI: [
    { constant: true, inputs: [], name: "getAllMarkets", outputs: [{ name: "", type: "address[]" }], type: "function" }
  ],
  tokenABI: [
    { constant: true, inputs: [], name: "exchangeRateStored", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "borrowBalanceStored", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "account", type: "address" }], name: "earned", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Wonderland ABIs:
type wonderlandABIs = 'memo';
export const wonderland: Record<`${wonderlandABIs}ABI`, ABI[]> = {
  memoABI: [
    { constant: true, inputs: [{ name: "_amount", type: "uint256" }], name: "wMEMOToMEMO", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Bouje ABIs:
type boujeABIs = 'masterChef';
export const bouje: Record<`${boujeABIs}ABI`, ABI[]> = {
  masterChefABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTime", type: "uint256" }, { name: "accBastillePerShare", type: "uint256" }, { name: "depositFeeBP", type: "uint16" }, { name: "lpSupply", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingBastille", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Pangolin ABIs:
type pangolinABIs = 'controller';
export const pangolin: Record<`${pangolinABIs}ABI`, ABI[]> = {
  controllerABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "lpToken", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingReward", outputs: [{ name: "pending", type: "uint256" }], type: "function" }
  ]
}

// Avalaunch ABIs:
type avalaunchABIs = 'staking';
export const avalaunch: Record<`${avalaunchABIs}ABI`, ABI[]> = {
  stakingABI: [
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "deposited", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pending", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Moonpot ABIs:
type moonpotABIs = 'pot';
export const moonpot: Record<`${moonpotABIs}ABI`, ABI[]> = {
  potABI: [
    { constant: true, inputs: [{ name: "user", type: "address" }], name: "userTotalBalance", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Alligator ABIs:
type alligatorABIs = 'factory' | 'masterChef';
export const alligator: Record<`${alligatorABIs}ABI`, ABI[]> = {
  factoryABI: [
    { constant: true, inputs: [], name: "allPairsLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "allPairs", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  masterChefABI: [
    { constant: true, inputs: [], name: "poolLength", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }, { name: "<input>", type: "address" }], name: "userInfo", outputs: [{ name: "amount", type: "uint256" }, { name: "rewardDebt", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "<input>", type: "uint256" }], name: "poolInfo", outputs: [{ name: "lpToken", type: "address" }, { name: "allocPoint", type: "uint256" }, { name: "lastRewardTimestamp", type: "uint256" }, { name: "accGtrPerShare", type: "uint256" }, { name: "rewarder", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_pid", type: "uint256" }, { name: "_user", type: "address" }], name: "pendingTokens", outputs: [{ name: "pendingGtr", type: "uint256" }], type: "function" }
  ]
}

// APWine ABIs:
type apwineABIs = 'registry' | 'future' | 'staking';
export const apwine: Record<`${apwineABIs}ABI`, ABI[]> = {
  registryABI: [
    { constant: true, inputs: [], name: "futureVaultCount", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [{ name: "_index", type: "uint256" }], name: "getFutureVaultAt", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  futureABI: [
    { constant: true, inputs: [], name: "PLATFORM_NAME", outputs: [{ name: "", type: "string" }], type: "function" },
    { constant: true, inputs: [], name: "getCurrentPeriodIndex", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "getPTAddress", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [{ name: "_periodIndex", type: "uint256" }], name: "getFYTofPeriod", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "getIBTAddress", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "getUnrealisedYieldPerPT", outputs: [{ name: "", type: "uint256" }], type: "function" },
    { constant: true, inputs: [], name: "getIBTRate", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ],
  stakingABI: [
    { constant: true, inputs: [{ name: "arg0", type: "address" }], name: "locked", outputs: [{ name: "amount", type: "uint128" }, { name: "end", type: "uint256" }], type: "function" }
  ]
}

// ParaSwap ABIs:
type paraswapABIs = 'staking';
export const paraswap: Record<`${paraswapABIs}ABI`, ABI[]> = {
  stakingABI: [
    { constant: true, inputs: [{ name: "_sPSPAmount", type: "uint256" }], name: "PSPForSPSP", outputs: [{ name: "pspAmount", type: "uint256" }], type: "function" }
  ]
}

// Paladin ABIs:
type paladinABIs = 'token' | 'pool';
export const paladin: Record<`${paladinABIs}ABI`, ABI[]> = {
  tokenABI: [
    { constant: true, inputs: [], name: "palPool", outputs: [{ name: "", type: "address" }], type: "function" }
  ],
  poolABI: [
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "exchangeRateStored", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// Harvest ABIs:
type harvestABIs = 'staking';
export const harvest: Record<`${harvestABIs}ABI`, ABI[]> = {
  stakingABI: [
    { constant: true, inputs: [], name: "underlying", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "getPricePerFullShare", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}

// TrueFi ABIs:
type truefiABIs = 'pool';
export const truefi: Record<`${truefiABIs}ABI`, ABI[]> = {
  poolABI: [
    { constant: true, inputs: [], name: "token", outputs: [{ name: "", type: "address" }], type: "function" },
    { constant: true, inputs: [], name: "poolValue", outputs: [{ name: "", type: "uint256" }], type: "function" }
  ]
}