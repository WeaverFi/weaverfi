
// Imports:
import { minABI, scream } from '../../ABIs';
import { query, addToken, addDebtToken, addXToken } from '../../functions';
import type { Chain, Address, Token, DebtToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'scream';
const controller: Address = '0x260E596DAbE3AFc463e75B6CC05d8c46aCAcFB09';
const screamToken: Address = '0xe0654C8e6fd4D733349ac7E09f6f23DA256bF475';
const xscream: Address = '0xe3D17C7e840ec140a7A51ACA351a482231760824';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken | XToken)[] = [];
  try {
    balance.push(...(await getMarketBalances(wallet)));
    balance.push(...(await getStakedSCREAM(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all market balances and debt:
const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: any[] = await query(chain, controller, scream.controllerABI, 'getAllMarkets', []);
  let promises = markets.map(market => (async () => {
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    let account = await query(chain, market, scream.marketABI, 'getAccountSnapshot', [wallet]);
    let debt = parseInt(account[2]);
    let exchangeRate = parseInt(account[3]);

    // Lending Balances:
    if(balance > 0) {
      let tokenAddress = await query(chain, market, scream.marketABI, 'underlying', []);
      let underlyingBalance = balance * (exchangeRate / (10 ** 18));
      let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
      balances.push(newToken);
    }

    // Borrowing Balances:
    if(debt > 0) {
      let tokenAddress = await query(chain, market, scream.marketABI, 'underlying', []);
      let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
      balances.push(newToken);
    }

  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked SCREAM balance:
const getStakedSCREAM = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xscream, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = parseInt(await query(chain, xscream, scream.stakingABI, 'getShareValue', [])) / (10 ** 18);
    let newToken = await addXToken(chain, project, 'unclaimed', xscream, balance, wallet, screamToken, balance * exchangeRate);
    return [newToken];
  } else {
    return [];
  }
}