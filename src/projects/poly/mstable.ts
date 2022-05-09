
// Imports:
import { WeaverError } from '../../error';
import { minABI, mstable } from '../../ABIs';
import { addStableToken } from '../../project-functions';
import { query, multicallOneMethodQuery, addToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'mstable';
const mta: Address = '0xf501dd45a1198c2e1b5aef5314a68b9006d842e0';
const imUSD: Address = '0x5290Ad3d83476CA6A2b178Cd9727eE1EF72432af';
const imUSDVault: Address = '0x32aBa856Dc5fFd5A56Bcd182b13380e5C855aa29';
const pools: Address[] = [
  '0xB30a907084AC8a0d25dDDAB4E364827406Fd09f0'
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getAssetBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getAssetBalances()', err) })));
  balance.push(...(await getPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get asset balances:
export const getAssetBalances = async (wallet: Address) => {
  let balances: Token[] = [];

  // imUSD:
  let usdAssetBalance = parseInt(await query(chain, imUSD, minABI, 'balanceOf', [wallet]));
  if(usdAssetBalance > 0) {
    let decimals = parseInt(await query(chain, imUSD, minABI, 'decimals', []));
    let exchangeRate = parseInt(await query(chain, imUSD, mstable.assetABI, 'exchangeRate', [])) / (10 ** decimals);
    let token = await query(chain, imUSD, mstable.assetABI, 'underlying', []);
    let newToken = await addToken(chain, project, 'staked', token, usdAssetBalance * exchangeRate, wallet);
    balances.push(newToken);
  }

  // imUSD Vault:
  let usdVaultBalance = parseInt(await query(chain, imUSDVault, minABI, 'balanceOf', [wallet]));
  if(usdVaultBalance > 0) {
    let decimals = parseInt(await query(chain, imUSD, minABI, 'decimals', []));
    let exchangeRate = parseInt(await query(chain, imUSD, mstable.assetABI, 'exchangeRate', [])) / (10 ** decimals);
    let token = await query(chain, imUSD, mstable.assetABI, 'underlying', []);
    let newToken = await addToken(chain, project, 'staked', token, usdVaultBalance * exchangeRate, wallet);
    balances.push(newToken);
    let rewards = parseInt(await query(chain, imUSDVault, mstable.vaultABI, 'earned', [wallet]));
    if(rewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', mta, rewards, wallet);
      balances.push(newToken);
    }
  }

  return balances;
}

// Function to get pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: Token[] = [];
  
  // Balance Multicall Query:
  let multicallResults = await multicallOneMethodQuery(chain, pools, minABI, 'balanceOf', [wallet]);
  let promises = pools.map(pool => (async () => {
    let balanceResults = multicallResults[pool];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        let newToken = await addStableToken(chain, project, 'staked', pool, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}