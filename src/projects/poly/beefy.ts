
// Imports:
import { WeaverError } from '../../error';
import { minABI, beefy } from '../../ABIs';
import { addCurveToken } from '../../project-functions';
import { query, multicallOneMethodQuery, addToken, addLPToken, parseBN, fetchData } from '../../functions';

// Type Imports:
import type { Chain, Address, URL, Token, LPToken, BeefyAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'beefy';
const staking: Address = '0xDeB0a777ba6f59C78c654B8c92F80238c8002DD2';
const bifi: Address = '0xfbdd194376de19a88118e84e279b977f165d01b8';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
const apiURL: URL = 'https://api.beefy.finance';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  const balance: (Token | LPToken)[] = [];
  const vaultsData: BeefyAPIResponse[] = await fetchData(`${apiURL}/vaults`);
  const apyData: Record<string, number | null> = await fetchData(`${apiURL}/apy`);
  const vaults = vaultsData.filter(vault => vault.chain === 'polygon' && vault.status === 'active');
  if(vaults.length > 0) {
    balance.push(...(await getVaultBalances(wallet, vaults, apyData).catch((err) => { throw new WeaverError(chain, project, 'getVaultBalances()', err) })));
    balance.push(...(await getStakedBIFI(wallet).catch((err) => { throw new WeaverError(chain, project, 'getStakedBIFI()', err) })));
  } else {
    throw new WeaverError(chain, project, 'Invalid response from Beefy API');
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get vault balances:
export const getVaultBalances = async (wallet: Address, vaults: BeefyAPIResponse[], apys: Record<string, number | null>) => {
  const balances: (Token | LPToken)[] = [];
  
  // Balance Multicall Query:
  const vaultAddresses = vaults.map(vault => vault.earnedTokenAddress);
  const multicallResults = await multicallOneMethodQuery(chain, vaultAddresses, minABI, 'balanceOf', [wallet]);
  const promises = vaults.map(vault => (async () => {
    const balanceResults = multicallResults[vault.earnedTokenAddress];
    if(balanceResults) {
      const balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        const exchangeRate = parseBN(vault.pricePerFullShare);
        const underlyingBalance = balance * (exchangeRate / (10 ** 18));
  
        // Native Token Vaults:
        if(!vault.tokenAddress) {
          if(vault.token === 'MATIC') {
            const newToken = await addToken(chain, project, 'staked', wmatic, underlyingBalance, wallet);
            const vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          }
        } else {
  
          // Curve Vaults:
          if(vault.platformId === 'curve' || vault.tokenProviderId === 'curve') {
            const newToken = await addCurveToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            const vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
    
          // LP Token Vaults:
          } else if(vault.assets.length === 2 && vault.tokenProviderId != 'kyber' && !vault.id.includes('jarvis')) {
            const newToken = await addLPToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            const vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
    
          // Single-Asset Vaults:
          } else if(vault.assets.length === 1) {
            const newToken = await addToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            const vaultAPY = apys[vault.id];
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
export const getStakedBIFI = async (wallet: Address) => {
  const balances: Token[] = [];
  const balance = parseInt(await query(chain, staking, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    const newToken = await addToken(chain, project, 'staked', bifi, balance, wallet, staking);
    balances.push(newToken);
  }
  const pendingRewards = parseInt(await query(chain, staking, beefy.stakingABI, 'earned', [wallet]));
  if(pendingRewards > 0) {
    const newToken = await addToken(chain, project, 'unclaimed', wmatic, pendingRewards, wallet, staking);
    balances.push(newToken);
  }
  return balances;
}