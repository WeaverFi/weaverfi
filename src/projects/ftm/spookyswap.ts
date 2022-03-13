
// Imports:
import { spookyswap } from '../../ABIs';
import { initResponse, query, addToken, addLPToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'spookyswap';
const masterChef: Address = '0x2b2929E785374c651a81A63878Ab22742656DcDd';
const boo: Address = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';
const xboo: Address = '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598';

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
      response.data.push(...(await getStakedBOO(wallet)));
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
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, masterChef, spookyswap.masterChefABI, 'poolLength', []));
  let poolList = [...Array(poolCount).keys()];
  let promises = poolList.map(poolID => (async () => {
    let balance = parseInt((await query(chain, masterChef, spookyswap.masterChefABI, 'userInfo', [poolID, wallet])).amount);
    if(balance > 0) {
      let token = (await query(chain, masterChef, spookyswap.masterChefABI, 'poolInfo', [poolID])).lpToken;
      let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
      balances.push(newToken);
      let rewards = parseInt(await query(chain, masterChef, spookyswap.masterChefABI, 'pendingBOO', [poolID, wallet]));
      if(rewards > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', boo, rewards, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked BOO:
const getStakedBOO = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xboo, spookyswap.xbooABI, 'BOOBalance', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', boo, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}