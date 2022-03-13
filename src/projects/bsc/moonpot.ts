
// Imports:
import axios from 'axios';
import { moonpot } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, add4BeltToken, addBeltToken, addAlpacaToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'moonpot';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      let pots: any[] = [];
      let apiData = ((await axios.get('https://api.moonpot.com/pots')).data.data);
      Object.keys(apiData).forEach(pot => {
        if(apiData[pot].status === 'active') {
          pots.push(apiData[pot]);
        }
      });
      response.data.push(...(await getPotBalances(wallet, pots)));
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

// Function to get pot balances:
const getPotBalances = async (wallet: Address, pots: any[]) => {
  let balances: (Token | LPToken)[] = [];
  let promises = pots.map(pot => (async () => {
    let balance = parseInt(await query(chain, pot.contractAddress, moonpot.potABI, 'userTotalBalance', [wallet]));
    if(balance > 0) {

      // 4Belt Pot:
      if(pot.token.includes('4Belt')) {
        let newToken = await add4BeltToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // Belt Pots:
      } else if(pot.token.startsWith('belt')) {
        let newToken = await addBeltToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // Alpaca Pots:
      } else if(pot.token.startsWith('ib')) {
        let newToken = await addAlpacaToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // LP Pots:
      } else if(pot.token.endsWith('LP')) {
        let newToken = await addLPToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // Single-Asset Pots:
      } else {
        let newToken = await addToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}