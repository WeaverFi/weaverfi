
// Imports:
import { minABI, quickswap } from '../../ABIs';
import { query, multicallOneMethodQuery, addToken, addLPToken, addXToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'quickswap';
const registry: Address = '0x8aAA5e259F74c8114e0a471d9f2ADFc66Bfe09ed';
const dualRegistry: Address = '0x9Dd12421C637689c3Fc6e661C9e2f02C2F61b3Eb';
const quick: Address = '0x831753dd7087cac61ab5644b308642cc1c33dc13';
const dquick: Address = '0xf28164a485b0b2c90639e47b0f377b4a438a16b1';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
const zero: Address = '0x0000000000000000000000000000000000000000';
const minFarmCount = 165;
const minDualFarmCount = 5;

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  try {
    let farms = await getFarms();
    let dualFarms = await getDualFarms();
    let ratio = await getRatio();
    balance.push(...(await getFarmBalances(wallet, farms, ratio)));
    balance.push(...(await getDualFarmBalances(wallet, dualFarms, ratio)));
    balance.push(...(await getStakedQUICK(wallet, ratio)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all farm balances:
export const getFarmBalances = async (wallet: Address, farms: Address[], ratio: number) => {
  let balances: (Token | LPToken)[] = [];
  
  // Balance Multicall Query:
  let multicallResults = await multicallOneMethodQuery(chain, farms, minABI, 'balanceOf', [wallet]);
  let promises = farms.map(farm => (async () => {
    let balanceResults = multicallResults[farm];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        let token = await query(chain, farm, quickswap.farmABI, 'stakingToken', []);
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

        // Pending QUICK Rewards:
        let rewards = parseInt(await query(chain, farm, quickswap.farmABI, 'earned', [wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', quick, rewards * ratio, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all dual farm balances:
export const getDualFarmBalances = async (wallet: Address, dualFarms: Address[], ratio: number) => {
  let balances: (Token | LPToken)[] = [];
  
  // Balance Multicall Query:
  let multicallResults = await multicallOneMethodQuery(chain, dualFarms, minABI, 'balanceOf', [wallet]);
  let promises = dualFarms.map(farm => (async () => {
    let balanceResults = multicallResults[farm];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        let token = await query(chain, farm, quickswap.dualFarmABI, 'stakingToken', []);
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

        // Pending QUICK Rewards:
        let rewardsA = parseInt(await query(chain, farm, quickswap.dualFarmABI, 'earnedA', [wallet]));
        if(rewardsA > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', quick, rewardsA * ratio, wallet);
          balances.push(newToken);
        }

        // Pending WMATIC Rewards:
        let rewardsB = parseInt(await query(chain, farm, quickswap.dualFarmABI, 'earnedB', [wallet]));
        if(rewardsB > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', wmatic, rewardsB, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked QUICK balance:
export const getStakedQUICK = async (wallet: Address, ratio: number) => {
  let balance = parseInt(await query(chain, dquick, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addXToken(chain, project, 'staked', dquick, balance, wallet, quick, balance * ratio);
    return [newToken];
  } else {
    return [];
  }
}

/* ========================================================================================================================================================================= */

// Function to get farms:
const getFarms = async () => {
  let farms: Address[] = [];
  let farmIDs = [...Array(minFarmCount + 1).keys()];
  let promises = farmIDs.map(id => (async () => {
    let stakingToken = await query(chain, registry, quickswap.registryABI, 'stakingTokens', [id]);
    let rewardsInfo = await query(chain, registry, quickswap.registryABI, 'stakingRewardsInfoByStakingToken', [stakingToken]);
    if(rewardsInfo) {
      farms.push(rewardsInfo.stakingRewards);
    }
  })());
  await Promise.all(promises);
  let i = minFarmCount;
  let maxReached = false;
  while(!maxReached) {
    let stakingToken = await query(chain, registry, quickswap.registryABI, 'stakingTokens', [++i]);
    if(stakingToken) {
      let rewardsInfo = await query(chain, registry, quickswap.registryABI, 'stakingRewardsInfoByStakingToken', [stakingToken]);
      if(rewardsInfo) {
        farms.push(rewardsInfo.stakingRewards);
      }
    } else {
      maxReached = true;
    }
  }
  return farms.filter(farm => farm != zero);
}

// Function to get dual reward farms:
const getDualFarms = async () => {
  let dualFarms: Address[] = [];
  let farmIDs = [...Array(minDualFarmCount + 1).keys()];
  let promises = farmIDs.map(id => (async () => {
    let stakingToken = await query(chain, dualRegistry, quickswap.dualRegistryABI, 'stakingTokens', [id]);
    let rewardsInfo = await query(chain, dualRegistry, quickswap.dualRegistryABI, 'stakingRewardsInfoByStakingToken', [stakingToken]);
    if(rewardsInfo) {
      dualFarms.push(rewardsInfo.stakingRewards);
    }
  })());
  await Promise.all(promises);
  let i = minDualFarmCount;
  let maxReached = false;
  while(!maxReached) {
    let stakingToken = await query(chain, dualRegistry, quickswap.dualRegistryABI, 'stakingTokens', [++i]);
    if(stakingToken) {
      let rewardsInfo = await query(chain, dualRegistry, quickswap.dualRegistryABI, 'stakingRewardsInfoByStakingToken', [stakingToken]);
      if(rewardsInfo) {
        dualFarms.push(rewardsInfo.stakingRewards);
      }
    } else {
      maxReached = true;
    }
  }
  return dualFarms.filter(farm => farm != zero);
}

// Function to get dQUICK ratio:
const getRatio = async () => {
  let ratio = parseInt(await query(chain, dquick, quickswap.stakingABI, 'dQUICKForQUICK', [100000000])) / (10 ** 8);
  return ratio;
}