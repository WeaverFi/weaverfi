
// Imports:
import { minABI, compound } from '../../ABIs';
import { query, multicallComplexQuery, addToken, addDebtToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, DebtToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'compound';
const controller: Address = '0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

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
  let markets: Address[] = await query(chain, controller, compound.controllerABI, 'getAllMarkets', []);
  
  // Market Balance Multicall Query:
  let abi = minABI.concat(compound.marketABI);
  let calls: CallContext[] = [
    { reference: 'marketBalance', methodName: 'balanceOf', methodParameters: [wallet] },
    { reference: 'accountSnapshot', methodName: 'getAccountSnapshot', methodParameters: [wallet] }
  ];
  let multicallResults = await multicallComplexQuery(chain, markets, abi, calls);
  let promises = markets.map(market => (async () => {
    let marketResults = multicallResults[market];
    if(marketResults) {
      let marketBalanceResults = marketResults['marketBalance'];
      let accountSnapshotResults = marketResults['accountSnapshot'];
      if(marketBalanceResults && accountSnapshotResults) {
        let balance = parseBN(marketBalanceResults[0]);
        let debt = parseBN(accountSnapshotResults[2]);
        let exchangeRate = parseBN(accountSnapshotResults[3]);
        if(balance > 0 || debt > 0) {
          let tokenAddress: Address = market.toLowerCase() === '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5' ? defaultAddress : await query(chain, market, compound.marketABI, 'underlying', []);
  
          // Lending Balances:
          if(balance > 0) {
            let underlyingBalance = balance * (exchangeRate / (10 ** 18));
            let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
            balances.push(newToken);
          }
    
          // Borrowing Balances:
          if(debt > 0) {
            let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
            balances.push(newToken);
          }
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}