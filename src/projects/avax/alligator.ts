
// Imports:
import { minABI, alligator } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addAlligatorToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'avax';
const project = 'alligator';
const factory = '0xD9362AA8E0405C93299C573036E7FB4ec3bE1240';
const masterChef: Address = '0x2cB3FF6894a07A9957Cf6797a29218CEBE13F42f';
const gtr: Address = '0x43c812ba28cb061b1be7514145a15c9e18a27342';
const xgtr: Address = '0x32A948F018870548bEd7e888Cd97a257b700D4c6';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getPoolBalances(wallet)));
      response.data.push(...(await getFarmBalances(wallet)));
      response.data.push(...(await getStakedGTR(wallet)));
    } catch(err: any) {
      console.error(err);
      response.status = 'error';
      response.data = [{error: 'Internal API Error'}];
    }
  }

  // Returning Response:
  return JSON.stringify(response, null, ' ');
}

/* ========================================================================================================================================================================= */

// Function to get all pool balances:
const getPoolBalances = async (wallet: Address) => {
  let balances: LPToken[] = [];
  let poolCount = parseInt(await query(chain, factory, alligator.factoryABI, 'allPairsLength', []));
  let pools = [...Array(poolCount).keys()];
  let promises = pools.map(poolID => (async () => {
    let lpToken = await query(chain, factory, alligator.factoryABI, 'allPairs', [poolID]);
    let balance = parseInt(await query(chain, lpToken, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all farm balances:
const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let farmCount = parseInt(await query(chain, masterChef, alligator.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  let promises = farms.map(farmID => (async () => {
    let balance = parseInt((await query(chain, masterChef, alligator.masterChefABI, 'userInfo', [farmID, wallet])).amount);
    if(balance > 0) {
      let token = (await query(chain, masterChef, alligator.masterChefABI, 'poolInfo', [farmID])).lpToken;
      let symbol = await query(chain, token, minABI, 'symbol', []);

      // Standard LPs:
      if(symbol === 'ALP') {
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

      // xGTR Farm:
      } else if(symbol === 'xGTR') {
        let newToken = await addAlligatorToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }

      // Pending Rewards:
      let rewards = parseInt((await query(chain, masterChef, alligator.masterChefABI, 'pendingTokens', [farmID, wallet])).pendingGtr);
      if(rewards > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', gtr, rewards, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked GTR balance:
const getStakedGTR = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xgtr, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addAlligatorToken(chain, project, 'staked', xgtr, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}