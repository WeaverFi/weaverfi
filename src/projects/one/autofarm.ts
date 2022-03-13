
// Imports:
import { autofarm } from '../../ABIs';
import { initResponse, query, addLPToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'one';
const project = 'autofarm';
const registry: Address = '0x67da5f2ffaddff067ab9d5f025f8810634d84287';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getVaultBalances(wallet)));
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

// Function to get all vault balances:
const getVaultBalances = async (wallet: Address) => {
  let balances: LPToken[] = [];
  let poolLength = parseInt(await query(chain, registry, autofarm.oneRegistryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  let promises = vaults.map(vaultID => (async () => {
    let balance = parseInt(await query(chain, registry, autofarm.oneRegistryABI, 'userInfo', [vaultID, wallet]));
    if(balance > 99) {
      let lpToken = await query(chain, registry, autofarm.oneRegistryABI, 'lpToken', [vaultID]);
      let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}