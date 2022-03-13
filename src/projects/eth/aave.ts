
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { query, addToken, addAaveBLPToken, addDebtToken } from '../../functions';
import type { Chain, Address, Token, LPToken, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'aave';
const aaveStaking: Address = '0x4da27a545c0c5B758a6BA100e3a049001de870f5';
const lpStaking: Address = '0xa1116930326D21fB917d5A27F1E9943A9595fb47';
const incentives: Address = '0xd784927Ff2f95ba542BfC824c8a8a98F3495f6b5';
const aaveToken: Address = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken)[] = [];
  try {
    balance.push(...(await getStakedAAVE(wallet)));
    balance.push(...(await getStakedLP(wallet)));
    let markets = (await axios.get('https://aave.github.io/aave-addresses/mainnet.json')).data.proto;
    balance.push(...(await getMarketBalances(wallet, markets)));
    balance.push(...(await getMarketDebt(wallet, markets)));
    balance.push(...(await getIncentives(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked AAVE balance:
const getStakedAAVE = async (wallet: Address) => {
  let balance = parseInt(await query(chain, aaveStaking, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', aaveToken, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked LP balance:
const getStakedLP = async (wallet: Address) => {
  let balance = parseInt(await query(chain, lpStaking, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let tokenAddress = await query(chain, lpStaking, aave.stakingABI, 'STAKED_TOKEN', []);
    let newToken = await addAaveBLPToken(chain, project, 'staked', tokenAddress, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get lending market balances:
const getMarketBalances = async (wallet: Address, markets: any) => {
  let balances: Token[] = [];
  let promises = markets.map((market: any) => (async () => {
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
const getMarketDebt = async (wallet: Address, markets: any) => {
  let debt: DebtToken[] = [];
  let promises = markets.map((market: any) => (async () => {
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
    let newToken = await addToken(chain, project, 'unclaimed', aaveToken, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}