
// Imports:
import axios from 'axios';
import { minABI, beefy, beethovenx } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addCurveToken, addBalancerLikeToken } from '../../functions';
import type { Request } from 'express';
import { Chain, Address, Token, LPToken, isToken } from 'cookietrack-types';
import { fBeetLogo, vault as beethovenxVault } from './beethovenx';

// Initializations:
const chain: Chain = 'ftm';
const project = 'beefy';
const staking: Address = '0x7fB900C14c9889A559C777D016a885995cE759Ee';
const bifi: Address = '0xd6070ae98b8069de6B494332d1A1a81B6179D960';
const wftm: Address = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';
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
      let vaults = result.data.filter((vault: any) => vault.chain === 'fantom' && vault.status === 'active' && vault.tokenAddress);
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

      // Beethoven X Vaults:
      } else if(vault.platform === 'Beethoven X') {
        let poolId = await query(chain, vault.tokenAddress, beethovenx.poolABI, 'getPoolId', []);
        let newToken = await addBalancerLikeToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet, poolId, beethovenxVault);
        if(isToken(newToken)) {
          newToken.logo = fBeetLogo;
        }
        balances.push(newToken);

      // Unique Vaults (3+ Assets):
      } else if(vault.assets.length > 2) {
        // None relevant / supported yet.

      // LP Token Vaults:
      } else if(vault.assets.length === 2 && vault.platform !== 'StakeSteak' && vault.platform !== 'Beethoven X') {
        let newToken = await addLPToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);

      // Single-Asset Vaults:
      } else if(vault.assets.length === 1) {
        if(vault.token === 'FTM') {
          let newToken = await addToken(chain, project, 'staked', wftm, underlyingBalance, wallet);
          balances.push(newToken);
        } else {
          let newToken = await addToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
          balances.push(newToken);
        }
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
    let newToken = await addToken(chain, project, 'unclaimed', wftm, pendingRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}