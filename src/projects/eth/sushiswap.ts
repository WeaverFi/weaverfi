
// Imports:
import { sushiswap } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'sushiswap';
const masterChef: Address = '0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd';
const masterChefV2: Address = '0xEF0881eC094552b2e128Cf945EF17a6752B4Ec5d';
const sushi: Address = '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getFarmBalances(wallet)));
    balance.push(...(await getFarmV2Balances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let sushiRewards = 0;
  let farmCount = parseInt(await query(chain, masterChef, sushiswap.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChef, sushiswap.masterChefABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let lpToken = await query(chain, masterChef, sushiswap.masterChefABI, 'lpToken', [farmID]);
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
  
        // Pending SUSHI Rewards:
        let rewards = parseInt(await query(chain, masterChef, sushiswap.masterChefABI, 'pendingSushi', [farmID, wallet]));
        if(rewards > 0) {
          sushiRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(sushiRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', sushi, sushiRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get farm V2 balances:
export const getFarmV2Balances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let sushiRewards = 0;
  let farmCount = parseInt(await query(chain, masterChefV2, sushiswap.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChefV2, sushiswap.masterChefABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let lpToken = await query(chain, masterChefV2, sushiswap.masterChefABI, 'lpToken', [farmID]);
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
  
        // Pending SUSHI Rewards:
        let rewards = parseInt(await query(chain, masterChefV2, sushiswap.masterChefABI, 'pendingSushi', [farmID, wallet]));
        if(rewards > 0) {
          sushiRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(sushiRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', sushi, sushiRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}