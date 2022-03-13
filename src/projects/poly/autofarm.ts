
// Imports:
import { minABI, autofarm } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addCurveToken, addBZXToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'poly';
const project = 'autofarm';
const registry: Address = '0x89d065572136814230a55ddeeddec9df34eb0b76';

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
  let balances: (Token | LPToken)[] = [];
  let poolLength = parseInt(await query(chain, registry, autofarm.registryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  let promises = vaults.map(vaultID => (async () => {
    let balance = parseInt(await query(chain, registry, autofarm.registryABI, 'stakedWantTokens', [vaultID, wallet]));
    if(balance > 99) {
      let token = (await query(chain, registry, autofarm.registryABI, 'poolInfo', [vaultID]))[0];
      let symbol = await query(chain, token, minABI, 'symbol', []);

      // Curve Vaults:
      if(vaultID === 66 || vaultID === 97 || vaultID === 98) {
        let newToken = await addCurveToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

      // BZX I-Token Vaults:
      } else if(vaultID > 58 && vaultID < 66) {
        let newToken = await addBZXToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

      // LP Token Vaults:
      } else if(symbol.includes('LP') || symbol === 'UNI-V2') {
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

      // Single-Asset Vaults:
      } else {
        let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}