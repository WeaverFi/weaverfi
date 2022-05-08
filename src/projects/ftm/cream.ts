
// Imports:
import { minABI, cream } from '../../ABIs';
import { query, multicallComplexQuery, addToken, addDebtToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, DebtToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'cream';
const controller: Address = '0x4250A6D3BD57455d7C6821eECb6206F507576cD2';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    balance.push(...(await getMarketBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
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