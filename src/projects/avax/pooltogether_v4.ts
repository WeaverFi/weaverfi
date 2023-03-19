
// Imports:
import { minABI } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'pooltogether_v4';
const poolTicket: Address = '0xB27f379C050f6eD0973A01667458af6eCeBc1d90';
const poolDeposit: Address = '0xF830F5Cb2422d555EC34178E27094a816c8F95EC';
const usdc: Address = '0xa7d7079b0fead91f3e65f86e8915cb59c1a4c664';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getPoolBalance(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalance()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pool balance:
export const getPoolBalance = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolTicket, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet, poolDeposit);
    return [newToken];
  } else {
    return [];
  }
}