
// Imports:
import { minABI, cream } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addDebtToken, parseBN } from '../../functions';
import type { Chain, Address, Token, DebtToken } from '../../types';

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

  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  markets.forEach(market => {
    queries.push({
      reference: market,
      contractAddress: market,
      abi: minABI.concat(cream.tokenABI),
      calls: [
        { reference: 'marketBalance', methodName: 'balanceOf', methodParameters: [wallet] },
        { reference: 'borrowBalance', methodName: 'borrowBalanceStored', methodParameters: [wallet] }
      ]
    });
  });

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = markets.map(market => (async () => {
    let marketBalanceResults = multicallResults[market].callsReturnContext.find(i => i.reference === 'marketBalance');
    let borrowBalanceResults = multicallResults[market].callsReturnContext.find(i => i.reference === 'borrowBalance');

    // Lending Balances:
    if(marketBalanceResults && marketBalanceResults.success) {
      let balance = parseBN(marketBalanceResults.returnValues[0]);
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
    if(borrowBalanceResults && borrowBalanceResults.success) {
      let debt = parseBN(borrowBalanceResults.returnValues[0]);
      if(debt > 0) {
        let tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
        let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}