
// Imports:
import { minABI, aave } from '../ABIs'; // Edit to include all the ABIs you need. Also change path to '../../ABIs'.
import { query, addToken, addLPToken } from '../functions'; // Edit to include all functions you need. Also change path to '../../functions'.
import type { Chain, Address, Token, LPToken } from '../types'; // Edit to include all types you need. Also change path to '../../types'.

// Initializations:
const chain: Chain = 'eth';  // Edit to be the relevant chain.
const project = 'aave';  // Edit to be the name of the dapp being added.
const aaveToken: Address = '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9'; // Remove this example.
// Initialize any other hard-coded addresses such as on-chain registries, token addresses, etc. (Example Above)

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = []; // If necessary, include other token types here such as NativeToken, DebtToken or XToken.
  try {
    balance.push(...(await getSomething(wallet))); // Edit to include all data necessary for project balances. You can have multiples of these.
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Example function (Change this to whatever you need):
export const getSomething = async (wallet: Address) => { // This function should be exported unless it is a helper function.
  let balance = parseInt(await query(chain, aaveToken, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'none', aaveToken, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

/*
  Check out the functions.ts file for many functions you can use to facilitate querying anything you'd like!
  There are also multicall functions to simplify any multicall queries you intend to use (if necessary).
  Alternatively, feel free to check out any of the other project integrations done by others.
*/