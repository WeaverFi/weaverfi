
// Imports:
import axios from 'axios';
import { minABI, beefy } from '../../ABIs';
import { query, addToken, addLPToken, add4BeltToken, addBeltToken, addAlpacaToken } from '../../functions';
import type { Chain, Address, URL, Token, LPToken, XToken, BeefyAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'beefy';
const staking: Address = '0x0d5761D9181C7745855FC985f646a842EB254eB9';
const bifi: Address = '0xca3f508b8e4dd382ee878a314789373d80a5190a';
const wbnb: Address = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const apiURL: URL = 'https://api.beefy.finance';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  try {
    let vaultsData: BeefyAPIResponse[] = (await axios.get(apiURL + '/vaults')).data;
    let apyData: Record<string, number | null> = (await axios.get(apiURL + '/apy')).data;
    let vaults = vaultsData.filter(vault => vault.chain === 'bsc' && vault.status === 'active');
    balance.push(...(await getVaultBalances(wallet, vaults, apyData)));
    balance.push(...(await getStakedBIFI(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get vault balances:
const getVaultBalances = async (wallet: Address, vaults: BeefyAPIResponse[], apys: Record<string, number | null>) => {
  let balances: (Token | LPToken | XToken)[] = [];
  let promises = vaults.map(vault => (async () => {
    let balance = parseInt(await query(chain, vault.earnedTokenAddress, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let decimals = parseInt(await query(chain, vault.earnedTokenAddress, minABI, 'decimals', []));
      let exchangeRate = parseInt(await query(chain, vault.earnedTokenAddress, beefy.vaultABI, 'getPricePerFullShare', []));
      let underlyingBalance = balance * (exchangeRate / (10 ** decimals));

      // Native Token Vaults:
      if(!vault.tokenAddress) {
        if(vault.token === 'BNB') {
          let newToken = await addToken(chain, project, 'staked', wbnb, underlyingBalance, wallet);
          let vaultAPY = apys[vault.id];
          if(vaultAPY) {
            newToken.info = {
              apy: vaultAPY
            }
          }
          balances.push(newToken);
        }

      // All Other Vaults:
      } else {

        // Unique Vaults (3+ Assets):
        if(vault.assets.length > 2) {
          if(vault.id === 'belt-4belt') {
            let newToken = await add4BeltToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            let vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          }
  
        // LP Token Vaults:
        } else if(vault.assets.length === 2 && vault.id != 'omnifarm-usdo-busd-ot' && vault.id != 'ellipsis-renbtc') {
          let newToken = await addLPToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
          let vaultAPY = apys[vault.id];
          if(vaultAPY) {
            newToken.info = {
              apy: vaultAPY
            }
          }
          balances.push(newToken);
  
        // Single-Asset Vaults:
        } else if(vault.assets.length === 1) {
          if(vault.platform === 'Belt') {
            let newToken = await addBeltToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            let vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          } else if(vault.platform === 'Alpaca') {
            let newToken = await addAlpacaToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            let vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          } else {
            let newToken = await addToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            let vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          }
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