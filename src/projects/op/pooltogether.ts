
// Imports:
import { minABI } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'op';
const project = 'pooltogether';
const poolTicketV4: Address = '0x62BB4fc73094c83B5e952C2180B23fA7054954c4';
const poolDepositV4: Address = '0x79Bc8bD53244bC8a9C8c27509a2d573650A83373';
const usdc: Address = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getPoolBalanceV4(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalanceV4()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get V4 pool balance:
export const getPoolBalanceV4 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolTicketV4, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet, poolDepositV4);
    return [newToken];
  } else {
    return [];
  }
}