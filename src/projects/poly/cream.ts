
// Imports:
import { minABI, cream } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, Token, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'cream';
const controller: Address = '0x20CA53E2395FA571798623F1cFBD11Fe2C114c24';

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
const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: any[] = await query(chain, controller, cream.controllerABI, 'getAllMarkets', []);
  let promises = markets.map(market => (async () => {

    // Lending Balances:
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let exchangeRate = parseInt(await query(chain, market, cream.tokenABI, 'exchangeRateStored', []));
      let decimals = parseInt(await query(chain, market, minABI, 'decimals', []));
      let tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
      let underlyingBalance = (balance / (10 ** decimals)) * (exchangeRate / (10 ** (decimals + 2)));
      let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
      balances.push(newToken);
    }

    // Borrowing Balances:
    let debt = parseInt(await query(chain, market, cream.tokenABI, 'borrowBalanceStored', [wallet]));
    if(debt > 0) {
      let tokenAddress = await query(chain, market, cream.tokenABI, 'underlying', []);
      let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}