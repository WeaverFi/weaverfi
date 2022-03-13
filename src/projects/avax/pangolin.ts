
// Imports:
import { pangolin } from '../../ABIs';
import { initResponse, query, addToken, addLPToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'avax';
const project = 'pangolin';
const controller: Address = '0x1f806f7C8dED893fd3caE279191ad7Aa3798E928';
const png: Address = '0x60781c2586d68229fde47564546784ab3faca982';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getFarmBalances(wallet)));
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

// Function to get farm balances:
const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let pngRewards = 0;
  let poolCount = parseInt(await query(chain, controller, pangolin.controllerABI, 'poolLength', []));
  let farms = [...Array(poolCount).keys()];
  let promises = farms.map(farmID => (async () => {
    let balance = parseInt((await query(chain, controller, pangolin.controllerABI, 'userInfo', [farmID, wallet])).amount);
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
  })());
  await Promise.all(promises);
  if(pngRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', png, pngRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}