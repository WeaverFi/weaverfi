
// Imports:
import { WeaverError } from '../../error';
import { minABI, beefy } from '../../ABIs';
import { add4BeltToken, addBeltToken, addAlpacaToken } from '../../project-functions';
import { query, multicallOneMethodQuery, addToken, addLPToken, parseBN, fetchData } from '../../functions';

// Type Imports:
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
  const balance: (Token | LPToken | XToken)[] = [];
  const vaultsData: BeefyAPIResponse[] = await fetchData(`${apiURL}/vaults`);
  const apyData: Record<string, number | null> = await fetchData(`${apiURL}/apy`);
  const vaults = vaultsData.filter(vault => vault.chain === 'bsc' && vault.status === 'active');
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
          if(vault.token === 'BNB') {
            const newToken = await addToken(chain, project, 'staked', wbnb, underlyingBalance, wallet);
            const vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          }
        } else {
  
          // Unique Vaults (3+ Assets):
          if(vault.assets.length > 2) {
            if(vault.id === 'belt-4belt') {
              const newToken = await add4BeltToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
              const vaultAPY = apys[vault.id];
              if(vaultAPY) {
                newToken.info = {
                  apy: vaultAPY
                }
              }
              balances.push(newToken);
            }
    
          // LP Token Vaults:
          } else if(vault.assets.length === 2 && vault.id != 'omnifarm-usdo-busd-ot' && vault.id != 'ellipsis-renbtc') {
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
            if(vault.platformId === 'belt' || vault.tokenProviderId === 'belt') {
              const newToken = await addBeltToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
              const vaultAPY = apys[vault.id];
              if(vaultAPY) {
                newToken.info = {
                  apy: vaultAPY
                }
              }
              balances.push(newToken);
            } else if(vault.platformId === 'alpaca' || vault.tokenProviderId === 'alpaca') {
              const newToken = await addAlpacaToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
              const vaultAPY = apys[vault.id];
              if(vaultAPY) {
                newToken.info = {
                  apy: vaultAPY
                }
              }
              balances.push(newToken);
            } else {
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
    const newToken = await addToken(chain, project, 'unclaimed', wbnb, pendingRewards, wallet, staking);
    balances.push(newToken);
  }
  return balances;
}