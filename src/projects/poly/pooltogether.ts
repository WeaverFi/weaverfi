
// Imports:
import { minABI, pooltogether } from '../../ABIs';
import { query, addToken } from '../../functions';
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'pooltogether';
const poolV4: Address = '0x6a304dFdb9f808741244b6bfEe65ca7B3b3A6076';
const usdc: Address = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const poolList: Address[] = [
  '0x887e17d791dcb44bfdda3023d26f7a04ca9c7ef4',
  '0xee06abe9e2af61cabcb13170e01266af2defa946'
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
    balance.push(...(await getPoolBalanceV4(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: Token[] = [];

  // Populating Pools Array:
  let pools: { address: Address, faucets: Address[] }[] = [];
  let faucet_promises = poolList.map(address => (async () => {
    let strategy = await query(chain, address, pooltogether.poolABI, 'prizeStrategy', []);
    let listener = await query(chain, strategy, pooltogether.strategyABI, 'tokenListener', []);
    if(address === '0xee06abe9e2af61cabcb13170e01266af2defa946') {
      pools.push({ address, faucets: [listener] });
    } else {
      let faucetList = (await query(chain, listener, pooltogether.listenerABI, 'getAddresses', [])).slice(0, -1);
      pools.push({ address, faucets: [...faucetList] });
    }
  })());
  await Promise.all(faucet_promises);

  // Fetching Pool Balances:
  let promises = pools.map(pool => (async () => {

    // Tickets:
    let tickets: Address[] = await query(chain, pool.address, pooltogether.poolABI, 'tokens', []);
    let ticket_promises = tickets.map(ticket => (async () => {
      let balance = parseInt(await query(chain, ticket, minABI, 'balanceOf', [wallet]));
      if(balance > 0) {
        let token = await query(chain, pool.address, pooltogether.poolABI, 'token', []);
        let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }
    })());
    await Promise.all(ticket_promises);

    // Faucet Rewards:
    let reward_promises = pool.faucets.map(faucet => (async () => {
      let balance = parseInt((await query(chain, faucet, pooltogether.faucetABI, 'userStates', [wallet])).balance);
      if(balance > 0) {
        let token = await query(chain, faucet, pooltogether.faucetABI, 'asset', []);
        let newToken = await addToken(chain, project, 'unclaimed', token, balance, wallet);
        balances.push(newToken);
      }
    })());
    await Promise.all(reward_promises);
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get V4 pool balance:
export const getPoolBalanceV4 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolV4, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}