
// Imports:
import { lostworlds } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'lostworlds';
const staking: Address = '0x2cf6625e35b241F30871FAac932dC5946D092631';
const lost: Address = '0x449674B82F05d498E126Dd6615a1057A9c088f2C';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getStakedLOST(wallet).catch((err) => { throw new WeaverError(chain, project, 'getStakedLOST()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked LOST balance:
export const getStakedLOST = async (wallet: Address) => {
  let balances: Token[] = [];
  let balance = await query(chain, staking, lostworlds.stakingABI, 'deposits', [wallet]);
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', lost, balance, wallet, staking);
    balances.push(newToken);
    let rewards = await query(chain, staking, lostworlds.stakingABI, 'getPendingReward', [wallet]);
    if(rewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', lost, rewards, wallet, staking);
      balances.push(newToken);
    }
  }
  return balances;
}