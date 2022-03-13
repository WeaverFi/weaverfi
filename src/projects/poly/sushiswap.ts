
// Imports:
import { sushiswap } from '../../ABIs';
import { query, addToken, addLPToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'sushiswap';
const masterChef: Address = '0x0769fd68dFb93167989C6f7254cd0D766Fb2841F';
const sushi: Address = '0x0b3f868e0be5597d5db7feb59e1cadbb0fdda50a';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getFarmBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let sushiRewards = 0;

  // MasterChef Farms:
  let farmCount = parseInt(await query(chain, masterChef, sushiswap.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  let promises = farms.map(farmID => (async () => {
    let balance = parseInt((await query(chain, masterChef, sushiswap.masterChefABI, 'userInfo', [farmID, wallet])).amount);
    if(balance > 0) {
      let lpToken = await query(chain, masterChef, sushiswap.masterChefABI, 'lpToken', [farmID]);
      let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
      balances.push(newToken);

      // Pending SUSHI Rewards:
      let rewards = parseInt(await query(chain, masterChef, sushiswap.masterChefABI, 'pendingSushi', [farmID, wallet]));
      if(rewards > 0) {
        sushiRewards += rewards;
      }
    }
  })());
  await Promise.all(promises);
  if(sushiRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', sushi, sushiRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}