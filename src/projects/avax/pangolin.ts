
// Imports:
import { pangolin } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'pangolin';
const controller: Address = '0x1f806f7C8dED893fd3caE279191ad7Aa3798E928';
const png: Address = '0x60781c2586d68229fde47564546784ab3faca982';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getFarmBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let pngRewards = 0;
  let poolCount = parseInt(await query(chain, controller, pangolin.controllerABI, 'poolLength', []));
  let farms = [...Array(poolCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, controller, pangolin.controllerABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let lpToken = await query(chain, controller, pangolin.controllerABI, 'lpToken', [farmID]);
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
  
        // Pending PNG Rewards:
        let rewards = parseInt(await query(chain, controller, pangolin.controllerABI, 'pendingReward', [farmID, wallet]));
        if(rewards > 0) {
          pngRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(pngRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', png, pngRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}