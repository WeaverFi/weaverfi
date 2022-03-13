
// Imports:
import axios from 'axios';
import { minABI, beefy } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addCurveToken, addIronToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'poly';
const project = 'beefy';
const staking: Address = '0xDeB0a777ba6f59C78c654B8c92F80238c8002DD2';
const bifi: Address = '0xfbdd194376de19a88118e84e279b977f165d01b8';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
const chars = 'abcdefghijklmnopqrstuvwxyz';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      let result;
      try {
        result = await axios.get(`https://api.beefy.finance/vaults?${chars[Math.floor(Math.random() * chars.length)]}`);
      } catch {
        result = await axios.get(`https://api.beefy.finance/vaults?${chars[Math.floor(Math.random() * chars.length)]}`);
      }
      let vaults = result.data.filter((vault: any) => vault.chain === 'polygon' && vault.status === 'active' && vault.tokenAddress);
      response.data.push(...(await getVaultBalances(wallet, vaults)));
      response.data.push(...(await getStakedBIFI(wallet)));
    } catch(err: any) {
      console.error(err);
      response.status = 'error';
      response.data = [{error: 'Internal API Error'}];
    }
  }

  // Returning Response:
  return JSON.stringify(response, null, ' ');
}

/* ========================================================================================================================================================================= */

// Function to get vault balances:
const getVaultBalances = async (wallet: Address, vaults: any[]) => {
  let balances: (Token | LPToken)[] = [];
  let promises = vaults.map(vault => (async () => {
    let balance = parseInt(await query(chain, vault.earnedTokenAddress, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let decimals = parseInt(await query(chain, vault.earnedTokenAddress, minABI, 'decimals', []));
      let exchangeRate = parseInt(await query(chain, vault.earnedTokenAddress, beefy.vaultABI, 'getPricePerFullShare', []));
      let underlyingBalance = balance * (exchangeRate / (10 ** decimals));

      // Curve Vaults:
      if(vault.platform === 'Curve') {
        let newToken = await addCurveToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);

      // Unique Vaults (3+ Assets):
      } else if(vault.assets.length > 2) {
        if(vault.paltform === 'IronFinance') {
          let newToken = await addIronToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
          balances.push(newToken);
        }

      // LP Token Vaults:
      } else if(vault.assets.length === 2 && vault.platform != 'Kyber' && !vault.id.includes('jarvis')) {
        let newToken = await addLPToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);

      // Single-Asset Vaults:
      } else if(vault.assets.length === 1) {
        let newToken = await addToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked BIFI balance:
const getStakedBIFI = async (wallet: Address) => {
  let balances: Token[] = [];
  let balance = parseInt(await query(chain, staking, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', bifi, balance, wallet);
    balances.push(newToken);
  }
  let pendingRewards = parseInt(await query(chain, staking, beefy.stakingABI, 'earned', [wallet]));
  if(pendingRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', wmatic, pendingRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}