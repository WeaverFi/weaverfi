
// Imports:
import { minABI, compound } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, Token, DebtToken } from '../../types';

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
  let markets = await query(chain, controller, compound.controllerABI, 'getAllMarkets', []);
  let promises = markets.map((market: any) => (async () => {
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    let account = await query(chain, market, compound.marketABI, 'getAccountSnapshot', [wallet]);
    let debt = parseInt(account[2]);
    let exchangeRate = parseInt(account[3]);

    // Lending Balances:
    if(balance > 0) {
      let tokenAddress: Address;
      if(market.toLowerCase() === '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5') {
        tokenAddress = defaultAddress;
      } else {
        tokenAddress = await query(chain, market, compound.marketABI, 'underlying', []);
      }
      let underlyingBalance = balance * (exchangeRate / (10 ** 18));
      let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
      balances.push(newToken);
    }

    // Borrowing Balances:
    if(debt > 0) {
      let tokenAddress: Address;
      if(market.toLowerCase() === '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5') {
        tokenAddress = defaultAddress;
      } else {
        tokenAddress = await query(chain, market, compound.marketABI, 'underlying', []);
      }
      let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}