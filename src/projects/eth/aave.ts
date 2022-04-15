
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { query, addToken, addDebtToken, addXToken, addAaveBLPToken } from '../../functions';
import type { Chain, Address, URL, Token, LPToken, DebtToken, XToken, AaveAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'aave';
const addressProvider: Address = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5';
const lpStaking: Address = '0xa1116930326D21fB917d5A27F1E9943A9595fb47';
const incentives: Address = '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5';
const stakedAave: Address = '0x4da27a545c0c5B758a6BA100e3a049001de870f5';
const aaveToken: Address = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';
const apiURL: URL = 'https://aave-api-v2.aave.com/data/liquidity/v2';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken | XToken)[] = [];
  try {
    let markets: AaveAPIResponse[] = (await axios.get(`${apiURL}?poolId=${addressProvider}`)).data;
    balance.push(...(await getMarketBalances(markets, wallet)));
    balance.push(...(await getIncentives(wallet)));
    balance.push(...(await getStakedAAVE(wallet)));
    balance.push(...(await getStakedLP(wallet)));
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

    // Stable Borrowing Balances:
    if(market.stableBorrowRateEnabled) {
      let stableDebt = parseInt(await query(chain, market.stableDebtTokenAddress, minABI, 'balanceOf', [wallet]));
      if(stableDebt > 0) {
        let newToken = await addDebtToken(chain, project, market.underlyingAsset, stableDebt, wallet);
        newToken.info = {
          apy: market.stableBorrowRate * 100,
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
    let newToken = await addToken(chain, project, 'unclaimed', aaveToken, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked AAVE balance:
export const getStakedAAVE = async (wallet: Address) => {
  let balance = parseInt(await query(chain, stakedAave, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addXToken(chain, project, 'staked', stakedAave, balance, wallet, aaveToken, balance);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked LP balance:
export const getStakedLP = async (wallet: Address) => {
  let balance = parseInt(await query(chain, lpStaking, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let tokenAddress = await query(chain, lpStaking, aave.stakingABI, 'STAKED_TOKEN', []);
    let newToken = await addAaveBLPToken(chain, project, 'staked', tokenAddress, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}