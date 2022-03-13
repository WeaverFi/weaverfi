
// Imports:
import { minABI, bouje } from '../../ABIs';
import { initResponse, query, addToken, addLPToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'bouje';
const masterChef: Address = '0x51839D39C4Fa187E3A084a4eD34a4007eae66238';
const bastille: Address = '0xcef2b88d5599d578c8d92E7a6e6235FBfaD01eF4';

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

// Function to get all farm/pool balances:
const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, masterChef, bouje.masterChefABI, 'poolLength', []));
  let poolList = [...Array(poolCount).keys()];
  let promises = poolList.map(poolID => (async () => {
    let balance = parseInt((await query(chain, masterChef, bouje.masterChefABI, 'userInfo', [poolID, wallet])).amount);
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
  })());
  await Promise.all(promises);
  return balances;
}