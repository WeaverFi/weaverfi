
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, URL, Token, DebtToken, AaveAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'aave';
const addressProvider: Address = '0xd05e3E715d945B59290df0ae8eF85c1BdB684744';
const incentives: Address = '0x357D51124f59836DeD84c8a1730D72B749d8BC23';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
const apiURL: URL = 'https://aave-api-v2.aave.com/data/liquidity/v2';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    let markets: AaveAPIResponse[] = (await axios.get(`${apiURL}?poolId=${addressProvider}`)).data;
    balance.push(...(await getMarketBalances(markets, wallet)));
    balance.push(...(await getIncentives(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get lending market balances:
const getMarketBalances = async (markets: AaveAPIResponse[], wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let promises = markets.map(market => (async () => {

    // Lending Balances:
    let balance = parseInt(await query(chain, market.aTokenAddress, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addToken(chain, project, 'lent', market.underlyingAsset, balance, wallet);
      newToken.info = {
        apy: market.avg7DaysLiquidityRate * 100,
        deprecated: !market.isActive
      }
      balances.push(newToken);
    }

    // Variable Borrowing Balances:
    if(market.borrowingEnabled) {
      let variableDebt = parseInt(await query(chain, market.variableDebtTokenAddress, minABI, 'balanceOf', [wallet]));
      if(variableDebt > 0) {
        let newToken = await addDebtToken(chain, project, market.underlyingAsset, variableDebt, wallet);
        newToken.info = {
          apy: market.avg7DaysVariableBorrowRate * 100,
        }
        balances.push(newToken);
      }
    }

  })());
  await Promise.all(promises);
  return balances;
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