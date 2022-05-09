
// Imports:
import { WeaverError } from '../../error';
import { minABI, cream } from '../../ABIs';
import { query, multicallComplexQuery, addToken, addDebtToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, DebtToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'cream';
const controller: Address = '0x2eE80614Ccbc5e28654324a66A396458Fa5cD7Cc';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  balance.push(...(await getMarketBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getMarketBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all market balances and debt:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, controller, cream.controllerABI, 'getAllMarkets', []);

  // Market Balance Multicall Query:
  let abi = minABI.concat(cream.tokenABI);
  let calls: CallContext[] = [
    { reference: 'marketBalance', methodName: 'balanceOf', methodParameters: [wallet] },
    { reference: 'borrowBalance', methodName: 'borrowBalanceStored', methodParameters: [wallet] }
  ];
  let multicallResults = await multicallComplexQuery(chain, markets, abi, calls);
  let promises = markets.map(market => (async () => {
    let marketResults = multicallResults[market];
    if(marketResults) {
      let marketBalanceResults = marketResults['marketBalance'];
      let borrowingResults = marketResults['borrowBalance'];

      // Lending Balances:
      if(marketBalanceResults) {
        let balance = parseBN(marketBalanceResults[0]);
        if(balance > 0) {
          let exchangeRate = parseInt(await query(chain, market, cream.tokenABI, 'exchangeRateStored', []));
          let decimals = parseInt(await query(chain, market, minABI, 'decimals', []));
          let tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
          let underlyingBalance = (balance / (10 ** decimals)) * (exchangeRate / (10 ** (decimals + 2)));
          let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
          balances.push(newToken);
        }
      }

      // Borrowing Balances:
      if(borrowingResults) {
        let debt = parseBN(borrowingResults[0]);
        if(debt > 0) {
          let tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
          let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}