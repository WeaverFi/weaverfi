
// Imports:
import { minABI, cream } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addDebtToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken, DebtToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'cream';
const controller: Address = '0x589de0f0ccf905477646599bb3e5c622c84cc0ba';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getMarketBalances(wallet)));
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

// Function to get all market balances and debt:
const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | LPToken | DebtToken)[] = [];
  let markets = await query(chain, controller, cream.controllerABI, 'getAllMarkets', []);
  let promises = markets.map((market: any) => (async () => {

    // Lending Balances:
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let exchangeRate = parseInt(await query(chain, market, cream.tokenABI, 'exchangeRateStored', []));
      let decimals = parseInt(await query(chain, market, minABI, 'decimals', []));
      let symbol = await query(chain, market, minABI, 'symbol', []);
      let tokenAddress: Address;
      if(market.toLowerCase() === '0x1Ffe17B99b439bE0aFC831239dDECda2A790fF3A'.toLowerCase()) {
        tokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      } else {
        tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
      }
      let underlyingBalance = (balance / (10 ** decimals)) * (exchangeRate / (10 ** (decimals + 2)));
      if(symbol.includes('CAKE-LP')) {
        let newToken = await addLPToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);
      } else {
        let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);
      }
    }

    // Borrowing Balances:
    let debt = parseInt(await query(chain, market, cream.tokenABI, 'borrowBalanceStored', [wallet]));
    if(debt > 0) {
      let symbol = await query(chain, market, minABI, 'symbol', []);
      let tokenAddress: Address;
      if(market.toLowerCase() === '0x1Ffe17B99b439bE0aFC831239dDECda2A790fF3A'.toLowerCase()) {
        tokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      } else {
        tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
      }
      if(!symbol.includes('CAKE-LP')) {
        let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}