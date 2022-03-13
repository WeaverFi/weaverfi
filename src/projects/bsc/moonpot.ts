
// Imports:
import axios from 'axios';
import { moonpot } from '../../ABIs';
import { query, addToken, addLPToken, add4BeltToken, addBeltToken, addAlpacaToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'moonpot';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    let pots: any[] = [];
    let apiData = ((await axios.get('https://api.moonpot.com/pots')).data.data);
    Object.keys(apiData).forEach(pot => {
      if(apiData[pot].status === 'active') {
        pots.push(apiData[pot]);
      }
    });
    balance.push(...(await getPotBalances(wallet, pots)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pot balances:
const getPotBalances = async (wallet: Address, pots: any[]) => {
  let balances: (Token | LPToken)[] = [];
  let promises = pots.map(pot => (async () => {
    let balance = parseInt(await query(chain, pot.contractAddress, moonpot.potABI, 'userTotalBalance', [wallet]));
    if(balance > 0) {

      // 4Belt Pot:
      if(pot.token.includes('4Belt')) {
        let newToken = await add4BeltToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // Belt Pots:
      } else if(pot.token.startsWith('belt')) {
        let newToken = await addBeltToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // Alpaca Pots:
      } else if(pot.token.startsWith('ib')) {
        let newToken = await addAlpacaToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // LP Pots:
      } else if(pot.token.endsWith('LP')) {
        let newToken = await addLPToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);

      // Single-Asset Pots:
      } else {
        let newToken = await addToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}