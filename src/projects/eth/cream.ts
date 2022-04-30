
// Imports:
import { minABI, cream } from '../../ABIs';
import { query, addToken } from '../../functions';
import type { Chain, Address, Token, LPToken, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'cream';
const staking: Address[] = [
  '0x780F75ad0B02afeb6039672E6a6CEDe7447a8b45',
  '0xBdc3372161dfd0361161e06083eE5D52a9cE7595',
  '0xD5586C1804D2e1795f3FBbAfB1FBB9099ee20A6c',
  '0xE618C25f580684770f2578FAca31fb7aCB2F5945'
];
const creamToken: Address = '0x2ba592f78db6436527729929aaf6c908497cb200';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken)[] = [];
  try {
    balance.push(...(await getStakedCREAM(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked CREAM balances:
export const getStakedCREAM = async (wallet: Address) => {
  let balances: Token[] = [];
  let promises = staking.map(address => (async () => {
    let balance = parseInt(await query(chain, address, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addToken(chain, project, 'staked', creamToken, balance, wallet);
      balances.push(newToken);
    }
    let earned = parseInt(await query(chain, address, cream.stakingABI, 'earned', [wallet]));
    if(earned > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', creamToken, earned, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}