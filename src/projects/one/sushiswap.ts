
// Imports:
import { sushiswap } from '../../ABIs';
import { initResponse, query, addToken, addLPToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'one';
const project = 'sushiswap';
const masterChef: Address = '0x67da5f2ffaddff067ab9d5f025f8810634d84287';
const sushi: Address = '0xbec775cb42abfa4288de81f387a9b1a3c4bc552a';

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
  let sushiRewards = 0;

  // MasterChef Farms:
  let farmCount = parseInt(await query(chain, masterChef, sushiswap.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  let promises = farms.map(farmID => (async () => {
    let balance = parseInt((await query(chain, masterChef, sushiswap.masterChefABI, 'userInfo', [farmID, wallet])).amount);
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
  })());
  await Promise.all(promises);
  if(sushiRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', sushi, sushiRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}