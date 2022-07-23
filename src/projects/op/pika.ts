
// Imports:
import { pika } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'op';
const project = 'pika';
const perpetualV2: Address = '0x2FaE8C7Edd26213cA1A88fC57B65352dbe353698';
const vaultFeeV2: Address = '0x58488bB666d2da33F8E8938Dbdd582D2481D4183';
const usdc: Address = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getUserStakeV2(wallet).catch((err) => { throw new WeaverError(chain, project, 'getUserStakeV2()', err) })));
  balance.push(...(await getUserRewardsV2(wallet).catch((err) => { throw new WeaverError(chain, project, 'getUserRewardsV2()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get V2 vault balance:
export const getUserStakeV2 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, perpetualV2, pika.perpetualV2ABI, 'getShareBalance', [wallet])) * 0.01;
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet, perpetualV2);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get V2 rewards:
export const getUserRewardsV2 = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, vaultFeeV2, pika.vaultFeeV2ABI, 'getClaimableReward', [wallet])) * 0.01;
  if (rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', usdc, rewards, wallet, vaultFeeV2);
    return [newToken];
  }
  else {
    return [];
  }
}