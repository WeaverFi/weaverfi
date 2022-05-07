
// Imports:
import { minABI, bouje } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'bouje';
const masterChef: Address = '0x51839D39C4Fa187E3A084a4eD34a4007eae66238';
const bastille: Address = '0xcef2b88d5599d578c8d92E7a6e6235FBfaD01eF4';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all farm/pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, masterChef, bouje.masterChefABI, 'poolLength', []));
  let poolList = [...Array(poolCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  poolList.forEach(poolID => {
    calls.push({ reference: poolID.toString(), methodName: 'userInfo', methodParameters: [poolID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChef, bouje.masterChefABI, calls);
  let promises = poolList.map(poolID => (async () => {
    let userInfoResults = multicallResults[poolID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChef, bouje.masterChefABI, 'poolInfo', [poolID])).lpToken;
        let symbol = await query(chain, token, minABI, 'symbol', []);
        if(symbol === 'spLP') {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        } else {
          let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }
        let rewards = parseInt(await query(chain, masterChef, bouje.masterChefABI, 'pendingBastille', [poolID, wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', bastille, rewards, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}