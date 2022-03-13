
// Imports:
import axios from 'axios';
import { minABI, beefy } from '../../ABIs';
import { query, addToken, addLPToken, add4BeltToken, addBeltToken, addAlpacaToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'beefy';
const staking: Address = '0x453d4ba9a2d594314df88564248497f7d74d6b2c';
const bifi: Address = '0xca3f508b8e4dd382ee878a314789373d80a5190a';
const wbnb: Address = '0x4BD17003473389A42DAF6a0a729f6Fdb328BbBd7';
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
    let vaults = result.data.filter((vault: any) => vault.chain === 'bsc' && vault.status === 'active' && vault.tokenAddress);
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

      // Unique Vaults (3+ Assets):
      if(vault.assets.length > 2) {
        if(vault.id === 'belt-4belt') {
          let newToken = await add4BeltToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
          balances.push(newToken);
        }

      // LP Token Vaults:
      } else if(vault.assets.length === 2 && vault.id != 'omnifarm-usdo-busd-ot' && vault.id != 'ellipsis-renbtc') {
        let newToken = await addLPToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
        balances.push(newToken);

      // Single-Asset Vaults:
      } else if(vault.assets.length === 1) {
        if(vault.platform === 'Belt') {
          let newToken = await addBeltToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
          balances.push(newToken);
        } else if(vault.platform === 'Alpaca') {
          let newToken = await addAlpacaToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
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
    let newToken = await addToken(chain, project, 'unclaimed', wbnb, pendingRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}