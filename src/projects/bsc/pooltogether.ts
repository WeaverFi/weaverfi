
// Imports:
import { minABI, pooltogether } from '../../ABIs';
import { query, addToken } from '../../functions';
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'pooltogether';
const pools: Address[] = [
  '0x06D75Eb5cA4Da7F7C7A043714172CF109D07a5F8',
  '0x2f4Fc07E4Bd097C68774E5bdAbA98d948219F827'
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pool balances:
const getPoolBalances = async (wallet: Address) => {
  let balances: Token[] = [];
  let promises = pools.map(pool => (async () => {
    let ticket = (await query(chain, pool, pooltogether.poolABI, 'tokens', []))[0];
    let balance = parseInt(await query(chain, ticket, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let token = await query(chain, pool, pooltogether.poolABI, 'token', []);
      let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}