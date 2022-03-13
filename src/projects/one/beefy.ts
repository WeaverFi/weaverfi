
// Imports:
import axios from 'axios';
import { minABI, beefy } from '../../ABIs';
import { query, addToken, addLPToken, addCurveToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'one';
const project = 'beefy';
const staking: Address = '0x5b96bbaca98d777cb736dd89a519015315e00d02';
const bifi: Address = '0x6ab6d61428fde76768d7b45d8bfeec19c6ef91a8';
const wone: Address = '0xcf664087a5bb0237a0bad6742852ec6c8d69a27a';
const chars = 'abcdefghijklmnopqrstuvwxyz';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    let result;
    try {
      result = await axios.get(`https://api.beefy.finance/vaults?${chars[Math.floor(Math.random() * chars.length)]}`);
    } catch {
      result = await axios.get(`https://api.beefy.finance/vaults?${chars[Math.floor(Math.random() * chars.length)]}`);
    }
    let vaults = result.data.filter((vault: any) => vault.chain === 'one' && vault.status === 'active' && vault.tokenAddress);
    balance.push(...(await getVaultBalances(wallet, vaults)));
    balance.push(...(await getStakedBIFI(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get vault balances:
const getVaultBalances = async (wallet: Address, vaults: any) => {
  let balances: (Token | LPToken)[] = [];
  let promises = vaults.map((vault: any) => (async () => {
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
        // None relevant / supported yet.

      // LP Token Vaults:
      } else if(vault.assets.length === 2) {
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
    let newToken = await addToken(chain, project, 'unclaimed', wone, pendingRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}