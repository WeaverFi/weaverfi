
// Imports:
import { minABI } from '../../ABIs';
import { query, addToken } from '../../functions';
import { query as queryTerra } from '../../terra-functions';

// Type Imports:
import type { Chain, Address, TerraAddress, Token } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'anchor';
const aust: Address = '0xaB9A04808167C170A9EC4f8a87a0cD781ebcd55e';
const ust: Address = '0xb599c3590F42f8F995ECfa0f85D2980B76862fc1';
const market: TerraAddress = 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  try {
    balance.push(...(await getEarnBalance(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get Earn aUST balance:
export const getEarnBalance = async (wallet: Address) => {
  let balance = parseInt(await query(chain, aust, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = (await queryTerra(market, {state: {}})).prev_exchange_rate;
    let newToken = await addToken(chain, project, 'staked', ust, balance * exchangeRate, wallet);
    return [newToken];
  } else {
    return [];
  }
}