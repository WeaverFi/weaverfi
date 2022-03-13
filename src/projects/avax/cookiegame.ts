
// Imports:
import { minABI, cookiegame } from '../../ABIs';
import { query, addCookieToken } from '../../functions';
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'cookiegame';
const bakery: Address = '0x30816cAf2ADc53C1A3fc77265dBf83c6901cbb3e';
const pantry: Address = '0x26266DbAf3249075e31BA360a8E68851403e8808';
const cookie: Address = '0xeb5c8484a5e3866cf9ac0a3e01ca19c3fbe9bd93';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  try {
    balance.push(...(await getCOOKIE(wallet)));
    balance.push(...(await getBakeryBalance(wallet)));
    balance.push(...(await getPantryBalance(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get COOKIE tokens in wallet:
const getCOOKIE = async (wallet: Address) => {
  let balance = parseInt(await query(chain, cookie, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addCookieToken(chain, project, 'none', cookie, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get COOKIE tokens in bakery:
const getBakeryBalance = async (wallet: Address) => {
  let cookieBalance = 0;
  let tokenIDs: number[] = [];
  let userInfo: any[] = await query(chain, bakery, cookiegame.bakeryABI, 'batchedStakesOfOwner', [wallet, 0, 9999]);
  userInfo.forEach(info => {
    tokenIDs.push(parseInt(info[0]));
  });
  let balances: string[] = await query(chain, bakery, cookiegame.bakeryABI, 'getCookiesAccruedForMany', [tokenIDs]);
  balances.forEach(balance => {
    cookieBalance += parseInt(balance);
  });
  if(cookieBalance > 0) {
    let newToken = await addCookieToken(chain, project, 'unclaimed', cookie, cookieBalance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get COOKIE tokens in pantry:
const getPantryBalance = async (wallet: Address) => {
  let balance = parseInt(await query(chain, pantry, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let supply = await query(chain, pantry, minABI, 'totalSupply', []);
    let cookiesStaked = parseInt(await query(chain, cookie, minABI, 'balanceOf', [pantry]));
    let newToken = await addCookieToken(chain, project, 'staked', cookie, (balance / supply) * cookiesStaked, wallet);
    return [newToken];
  } else {
    return [];
  }
}