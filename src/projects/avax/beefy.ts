
// Imports:
import { WeaverError } from '../../error';
import { minABI, beefy } from '../../ABIs';
import { addCurveToken } from '../../project-functions';
import { query, multicallOneMethodQuery, addToken, addLPToken, parseBN, fetchData } from '../../functions';

// Type Imports:
import type { Chain, Address, URL, Token, LPToken, BeefyAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'beefy';
const staking: Address = '0x86d38c6b6313c5A3021D68D1F57CF5e69197592A';
const bifi: Address = '0xd6070ae98b8069de6B494332d1A1a81B6179D960';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
const apiURL: URL = 'https://api.beefy.finance';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  const balance: (Token | LPToken)[] = [];
  const vaultsData: BeefyAPIResponse[] = await fetchData(`${apiURL}/vaults`);
  const apyData: Record<string, number | null> = await fetchData(`${apiURL}/apy`);
  const vaults = vaultsData.filter(vault => vault.chain === 'avax' && vault.status === 'active');
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
          if(vault.token === 'AVAX') {
            const newToken = await addToken(chain, project, 'staked', wavax, underlyingBalance, wallet);
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
          } else if(vault.assets.length === 2) {
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
    const newToken = await addToken(chain, project, 'unclaimed', wavax, pendingRewards, wallet, staking);
    balances.push(newToken);
  }
  return balances;
}