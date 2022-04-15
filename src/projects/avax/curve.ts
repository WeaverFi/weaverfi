
// Imports:
import { minABI, curve } from '../../ABIs';
import { query, addToken, addCurveToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'curve';
const pools: Address[] = [
  '0x5B5CFE992AdAC0C9D48E05854B2d91C73a003858', // Aave Gauge
  '0x0f9cb53Ebe405d49A0bbdBD291A65Ff571bC83e1', // renBTC Gauge
  '0x445FE580eF8d70FF569aB36e80c647af338db351'  // ATriCrypto Gauge
];
const zero: Address = '0x0000000000000000000000000000000000000000';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let promises = pools.map(gauge => (async () => {
    let balance = parseInt(await query(chain, gauge, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let token = await query(chain, gauge, curve.gaugeABI, 'lp_token', []);
      let newToken = await addCurveToken(chain, project, 'staked', token, balance, wallet);
      balances.push(newToken);

      // Pending Rewards:
      for(let i = 0; i < 2; i++) {
        let token = await query(chain, gauge, curve.gaugeABI, 'reward_tokens', [i]);
        if(token != zero) {
          let rewards = parseInt(await query(chain, gauge, curve.gaugeABI, 'claimable_reward', [wallet, token]));
          if(rewards > 0) {
            let newToken = await addToken(chain, project, 'unclaimed', token, rewards, wallet);
            balances.push(newToken);
          }
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}