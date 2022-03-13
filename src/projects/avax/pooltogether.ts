
// Imports:
import { minABI } from '../../ABIs';
import { initResponse, query, addToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'avax';
const project = 'pooltogether';
const poolV4: Address = '0xB27f379C050f6eD0973A01667458af6eCeBc1d90';
const usdc: Address = '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getPoolBalanceV4(wallet)));
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

// Function to get V4 pool balance:
const getPoolBalanceV4 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolV4, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}