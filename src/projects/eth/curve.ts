
// Imports:
import { minABI, curve } from '../../ABIs';
import { initResponse, query, addCurveToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'eth';
const project = 'curve';
const registry: Address = '0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5';

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

// Function to get pool balances:
const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, registry, curve.registryABI, 'pool_count', []));
  let pools = [...Array(poolCount).keys()];
  let promises = pools.map(poolID => (async () => {
    let address = await query(chain, registry, curve.registryABI, 'pool_list', [poolID]);
    let gauge = (await query(chain, registry, curve.registryABI, 'get_gauges', [address]))[0][0];
    if(gauge != '0x0000000000000000000000000000000000000000') {
      let balance = parseInt(await query(chain, gauge, minABI, 'balanceOf', [wallet]));
      if(balance > 0) {
        let token = await query(chain, gauge, curve.gaugeABI, 'lp_token', []);
        let newToken = await addCurveToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}