
// Imports:
import { pika } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'op';
const project = 'pika';
const perpetual: Address = '0x2FaE8C7Edd26213cA1A88fC57B65352dbe353698';
const vaultFee: Address = '0x58488bB666d2da33F8E8938Dbdd582D2481D4183';
const usdc: Address = '0x7F5c764cBc14f9669B88837ca1490cCa17c31607';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getUserStake(wallet).catch((err) => { throw new WeaverError(chain, project, 'getUserStake()', err) })));
  balance.push(...(await getUserRewards(wallet).catch((err) => { throw new WeaverError(chain, project, 'getUserRewards()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get vault balance:
export const getUserStake = async (wallet: Address) => {
  let balance = parseInt(await query(chain, perpetual, pika.perpetualABI, 'getShareBalance', [wallet])) * 0.01;
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet, perpetual);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get rewards:
export const getUserRewards = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, vaultFee, pika.vaultFeeABI, 'getClaimableReward', [wallet])) * 0.01;
  if (rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', usdc, rewards, wallet, vaultFee);
    return [newToken];
  }
  else {
    return [];
  }
}