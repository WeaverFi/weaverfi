
// Imports:
import { minABI, belt } from '../../ABIs';
import { query, addToken, addLPToken, add4BeltToken, addBeltToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'belt';
const masterBelt: Address = '0xD4BbC80b9B102b77B21A06cb77E954049605E6c1';
const rewardToken: Address = '0xE0e514c71282b6f4e823703a39374Cf58dc3eA4f';

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
const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let beltRewards = 0;
  let poolLength = parseInt(await query(chain, masterBelt, belt.masterBeltABI, 'poolLength', []));
  let pools = [...Array(poolLength).keys()].filter(pool => pool != 0 && pool != 12 && pool != 13);
  let promises = pools.map(poolID => (async () => {
    let balance = parseInt(await query(chain, masterBelt, belt.masterBeltABI, 'stakedWantTokens', [poolID, wallet]));
    if(balance > 0) {
      let token = (await query(chain, masterBelt, belt.masterBeltABI, 'poolInfo', [poolID])).want;
      let symbol = await query(chain, token, minABI, 'symbol', []);

      // LP Tokens:
      if(symbol === 'Cake-LP') {
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

      // 4Belt Token:
      } else if(symbol === '4Belt') {
        let newToken = await add4BeltToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);

      // Belt Tokens:
      } else {
        let newToken = await addBeltToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }

      // Pending BELT Rewards:
      let rewards = parseInt(await query(chain, masterBelt, belt.masterBeltABI, 'pendingBELT', [poolID, wallet]));
      if(rewards > 0) {
        beltRewards += rewards;
      }
    }
  })());
  await Promise.all(promises);
  if(beltRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', rewardToken, beltRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}