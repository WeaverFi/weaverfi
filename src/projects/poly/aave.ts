
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, Token, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'aave';
const incentives: Address = '0x357D51124f59836DeD84c8a1730D72B749d8BC23';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    let markets = (await axios.get('https://aave.github.io/aave-addresses/polygon.json')).data.matic;
    balance.push(...(await getMarketBalances(wallet, markets)));
    balance.push(...(await getMarketDebt(wallet, markets)));
    balance.push(...(await getIncentives(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get lending market balances:
const getMarketBalances = async (wallet: Address, markets: any[]) => {
  let balances: Token[] = [];
  let promises = markets.map(market => (async () => {
    let balance = parseInt(await query(chain, market.aTokenAddress, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addToken(chain, project, 'lent', market.address, balance, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get lending market debt:
const getMarketDebt = async (wallet: Address, markets: any[]) => {
  let debt: DebtToken[] = [];
  let promises = markets.map(market => (async () => {
    let stableDebt = parseInt(await query(chain, market.stableDebtTokenAddress, minABI, 'balanceOf', [wallet]));
    let variableDebt = parseInt(await query(chain, market.variableDebtTokenAddress, minABI, 'balanceOf', [wallet]));
    let totalDebt = stableDebt + variableDebt;
    if(totalDebt > 0) {
      let newToken = await addDebtToken(chain, project, market.address, totalDebt, wallet);
      debt.push(newToken);
    }
  })());
  await Promise.all(promises);
  return debt;
}

// Function to get unclaimed incentives:
const getIncentives = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, incentives, aave.incentivesABI, 'getUserUnclaimedRewards', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', wmatic, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}