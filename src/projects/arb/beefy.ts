
// Imports:
import { WeaverError } from '../../error';
import { minABI, beefy } from '../../ABIs';
import { addCurveToken } from '../../project-functions';
import { query, multicallOneMethodQuery, addToken, addLPToken, parseBN, fetchData } from '../../functions';

// Type Imports:
import type { Chain, Address, URL, Token, LPToken, XToken, BeefyAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'arb';
const project = 'beefy';
const staking: Address = '0x48F4634c8383aF01BF71AefBC125eb582eb3C74D';
const bifi: Address = '0x99C409E5f62E4bd2AC142f17caFb6810B8F0BAAE';
const weth: Address = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';
const apiURL: URL = 'https://api.beefy.finance';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  const balance: (Token | LPToken | XToken)[] = [];
  const vaultsData: BeefyAPIResponse[] = await fetchData(`${apiURL}/vaults`);
  const apyData: Record<string, number | null> = await fetchData(`${apiURL}/apy`);
  const vaults = vaultsData.filter(vault => vault.chain === 'arbitrum' && vault.status === 'active');
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
  const balances: (Token | LPToken | XToken)[] = [];
  
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
          if(vault.token === 'ETH') {
            const newToken = await addToken(chain, project, 'staked', weth, underlyingBalance, wallet);
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
    const newToken = await addToken(chain, project, 'unclaimed', weth, pendingRewards, wallet, staking);
    balances.push(newToken);
  }
  return balances;
}