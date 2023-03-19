
// Imports:
import { minABI } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'op';
const project = 'pooltogether_v4';
const poolTicket: Address = '0x62BB4fc73094c83B5e952C2180B23fA7054954c4';
const poolDeposit: Address = '0x79Bc8bD53244bC8a9C8c27509a2d573650A83373';
const usdc: Address = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607';

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