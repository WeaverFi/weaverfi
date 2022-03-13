
// Imports:
import { avalaunch } from '../../ABIs';
import { query, addToken, addLPToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'avalaunch';
const staking: Address = '0xA6A01f4b494243d84cf8030d982D7EeB2AeCd329';
const lpStaking: Address = '0x6E125b68F0f1963b09add1b755049e66f53CC1EA';
const lpToken: Address = '0x42152bDD72dE8d6767FE3B4E17a221D6985E8B25';
const xava: Address = '0xd1c3f94de7e5b45fa4edbba472491a9f4b166fc4';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getStakedXAVA(wallet)));
    balance.push(...(await getStakedLP(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked XAVA balance:
const getStakedXAVA = async (wallet: Address) => {
  let xavaBalance = 0;
  let balance = parseInt(await query(chain, staking, avalaunch.stakingABI, 'deposited', [0, wallet]));
  if(balance > 0) {
    xavaBalance += balance;
    let pendingXAVA = parseInt(await query(chain, staking, avalaunch.stakingABI, 'pending', [0, wallet]));
    if(pendingXAVA > 0) {
      xavaBalance += pendingXAVA;
    }
    let newToken = await addToken(chain, project, 'staked', xava, xavaBalance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked LP balance:
const getStakedLP = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let balance = parseInt(await query(chain, lpStaking, avalaunch.stakingABI, 'deposited', [0, wallet]));
  if(balance > 0) {
    let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
    balances.push(newToken);
    let pendingXAVA = parseInt(await query(chain, lpStaking, avalaunch.stakingABI, 'pending', [0, wallet]));
    if(pendingXAVA > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', xava, pendingXAVA, wallet);
      balances.push(newToken);
    }
  }
  return balances;
}