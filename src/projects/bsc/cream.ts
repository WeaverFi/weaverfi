
// Imports:
import { minABI, cream } from '../../ABIs';
import { query, multicallQuery, addToken, addLPToken, addDebtToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, LPToken, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'cream';
const controller: Address = '0x589de0f0ccf905477646599bb3e5c622c84cc0ba';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken)[] = [];
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
  let balances: (Token | LPToken | DebtToken)[] = [];
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
        let symbol = await query(chain, market, minABI, 'symbol', []);
        let tokenAddress: Address;
        if(market.toLowerCase() === '0x1ffe17b99b439be0afc831239ddecda2a790ff3a') {
          tokenAddress = defaultAddress;
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
    }

    // Borrowing Balances:
    if(borrowBalanceResults && borrowBalanceResults.success) {
      let debt = parseBN(borrowBalanceResults.returnValues[0]);
      if(debt > 0) {
        let symbol = await query(chain, market, minABI, 'symbol', []);
        let tokenAddress: Address;
        if(market.toLowerCase() === '0x1ffe17b99b439be0afc831239ddecda2a790ff3a') {
          tokenAddress = defaultAddress;
        } else {
          tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
        }
        if(!symbol.includes('CAKE-LP')) {
          let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}