
// Imports:
import { minABI, cream } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addDebtToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken, DebtToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'eth';
const project = 'cream';
const controller0: Address = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const controller1: Address = '0xab1c342c7bf5ec5f02adea1c2270670bca144cbb';
const staking: Address[] = [
  '0x780F75ad0B02afeb6039672E6a6CEDe7447a8b45',
  '0xBdc3372161dfd0361161e06083eE5D52a9cE7595',
  '0xD5586C1804D2e1795f3FBbAfB1FBB9099ee20A6c',
  '0xE618C25f580684770f2578FAca31fb7aCB2F5945'
];
const creamToken: Address = '0x2ba592f78db6436527729929aaf6c908497cb200';

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
      response.data.push(...(await getStakedCREAM(wallet)));
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
  let markets0 = await query(chain, controller0, cream.controllerABI, 'getAllMarkets', []);
  let markets1 = await query(chain, controller1, cream.controllerABI, 'getAllMarkets', []);
  let markets = markets0.concat(markets1);
  let promises = markets.map((market: any) => (async () => {

    // Lending Balances:
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let exchangeRate = parseInt(await query(chain, market, cream.tokenABI, 'exchangeRateStored', []));
      let decimals = parseInt(await query(chain, market, minABI, 'decimals', []));
      let symbol = await query(chain, market, minABI, 'symbol', []);
      let tokenAddress: Address;
      if(market.toLowerCase() === '0xd06527d5e56a3495252a528c4987003b712860ee' || market.toLowerCase() === '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5') {
        tokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      } else {
        tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
      }
      let underlyingBalance = (balance / (10 ** decimals)) * (exchangeRate / (10 ** (decimals + 2)));
      if(symbol.includes('UNI-') || symbol.includes('SLP')) {
        let newToken = await addLPToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);
      } else if(!symbol.includes('Curve')) {
        let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);
      }
    }

    // Borrowing Balances:
    let debt = parseInt(await query(chain, market, cream.tokenABI, 'borrowBalanceStored', [wallet]));
    if(debt > 0) {
      let symbol = await query(chain, market, minABI, 'symbol', []);
      let tokenAddress: Address;
      if(market.toLowerCase() === '0xd06527d5e56a3495252a528c4987003b712860ee' || market.toLowerCase() === '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5') {
        tokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      } else {
        tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
      }
      if(!symbol.includes('UNI-') && !symbol.includes('SLP') && !symbol.includes('Curve')) {
        let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked CREAM balances:
const getStakedCREAM = async (wallet: Address) => {
  let balances: Token[] = [];
  let promises = staking.map(address => (async () => {
    let balance = parseInt(await query(chain, address, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addToken(chain, project, 'staked', creamToken, balance, wallet);
      balances.push(newToken);
    }
    let earned = parseInt(await query(chain, address, cream.stakingABI, 'earned', [wallet]));
    if(earned > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', creamToken, earned, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}