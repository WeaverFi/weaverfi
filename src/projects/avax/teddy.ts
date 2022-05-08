
// Imports:
import { teddy } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'teddy';
const trove: Address = '0xd22b04395705144Fd12AfFD854248427A2776194';
const stabilityPool: Address = '0x7AEd63385C03Dc8ed2133F705bbB63E8EA607522';
const staking: Address = '0xb4387D93B5A9392f64963cd44389e7D9D2E1053c';
const tsd: Address = '0x4fbf0429599460D327BD5F55625E30E4fC066095';
const teddyToken: Address = '0x094bd7B2D99711A1486FB94d4395801C6d0fdDcC';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    balance.push(...(await getTroveBalance(wallet)));
    balance.push(...(await getStabilityPoolBalance(wallet)));
    balance.push(...(await getStakedTEDDY(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get trove balance:
export const getTroveBalance = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let userInfo = await query(chain, trove, teddy.troveABI, 'Troves', [wallet]);
  if(parseInt(userInfo.status) === 1) {
    let debt = parseInt(userInfo.debt);
    if(debt > 0) {
      let newToken = await addDebtToken(chain, project, tsd, debt, wallet);
      balances.push(newToken);
    }
    let collateral = parseInt(userInfo.coll);
    if(collateral > 0) {
      let newToken = await addToken(chain, project, 'staked', defaultAddress, collateral, wallet);
      balances.push(newToken);
    }
  }
  return balances;
}

// Function to get stability pool balance:
export const getStabilityPoolBalance = async (wallet: Address) => {
  let balances: Token[] = [];
  let userInfo = await query(chain, stabilityPool, teddy.stabilityPoolABI, 'deposits', [wallet]);
  let balance = parseInt(userInfo.initialValue);
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', tsd, balance, wallet);
    balances.push(newToken);
    let avaxRewards = await query(chain, stabilityPool, teddy.stabilityPoolABI, 'getDepositorETHGain', [wallet]);
    if(avaxRewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', defaultAddress, avaxRewards, wallet);
      balances.push(newToken);
    }
    let teddyRewards = await query(chain, stabilityPool, teddy.stabilityPoolABI, 'getDepositorLQTYGain', [wallet]);
    if(teddyRewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', teddyToken, teddyRewards, wallet);
      balances.push(newToken);
    }
  }
  return balances;
}

// Function to get staked TEDDY balance:
export const getStakedTEDDY = async (wallet: Address) => {
  let balances: Token[] = [];
  let balance = await query(chain, staking, teddy.stakingABI, 'stakes', [wallet]);
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', teddyToken, balance, wallet);
    balances.push(newToken);
    let avaxRewards = await query(chain, staking, teddy.stakingABI, 'getPendingETHGain', [wallet]);
    if(avaxRewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', defaultAddress, avaxRewards, wallet);
      balances.push(newToken);
    }
    let tsdRewards = await query(chain, staking, teddy.stakingABI, 'getPendingLUSDGain', [wallet]);
    if(tsdRewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', tsd, tsdRewards, wallet);
      balances.push(newToken);
    }
  }
  return balances;
}