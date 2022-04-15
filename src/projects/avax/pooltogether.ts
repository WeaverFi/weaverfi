
// Imports:
import { minABI } from '../../ABIs';
import { query, addToken } from '../../functions';
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'pooltogether';
const poolV4: Address = '0xB27f379C050f6eD0973A01667458af6eCeBc1d90';
const usdc: Address = '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  try {
    balance.push(...(await getPoolBalanceV4(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get V4 pool balance:
export const getPoolBalanceV4 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolV4, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}