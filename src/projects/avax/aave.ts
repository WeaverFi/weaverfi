
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, URL, Token, DebtToken, AaveAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'aave';
const addressProvider: Address = '0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f';
const incentives: Address = '0x01D83Fe6A10D2f2B7AF17034343746188272cAc9';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
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
export const getMarketBalances = async (markets: AaveAPIResponse[], wallet: Address) => {
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
export const getIncentives = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, incentives, aave.incentivesABI, 'getUserUnclaimedRewards', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', wavax, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}