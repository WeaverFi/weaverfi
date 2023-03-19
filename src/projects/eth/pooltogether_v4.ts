
// Imports:
import { minABI } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'pooltogether_v4';
const poolTicket: Address = '0xdd4d117723C257CEe402285D3aCF218E9A8236E1';
const poolDeposit: Address = '0xd89a09084555a7D0ABe7B111b1f78DFEdDd638Be';
const usdc: Address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

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