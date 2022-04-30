
// Imports:
import axios from 'axios';
import { minABI, beefy } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addLPToken, addCurveToken, addIronToken, parseBN } from '../../functions';
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
  let balance: (Token | LPToken)[] = [];
  try {
    let vaultsData: BeefyAPIResponse[] = (await axios.get(apiURL + '/vaults')).data;
    let apyData: Record<string, number | null> = (await axios.get(apiURL + '/apy')).data;
    let vaults = vaultsData.filter(vault => vault.chain === 'polygon' && vault.status === 'active');
    balance.push(...(await getVaultBalances(wallet, vaults, apyData)));
    balance.push(...(await getStakedBIFI(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get vault balances:
export const getVaultBalances = async (wallet: Address, vaults: BeefyAPIResponse[], apys: Record<string, number | null>) => {
  let balances: (Token | LPToken)[] = [];

  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  vaults.forEach(vault => {
    queries.push({
      reference: vault.id,
      contractAddress: vault.earnedTokenAddress,
      abi: minABI,
      calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
    });
  });

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = vaults.map(vault => (async () => {
    let balanceResults = multicallResults[vault.id].callsReturnContext[0];
    if(balanceResults.success) {
      let balance = parseBN(balanceResults.returnValues[0]);
      if(balance > 0) {
        let decimals = parseInt(await query(chain, vault.earnedTokenAddress, minABI, 'decimals', []));
        let exchangeRate = parseInt(await query(chain, vault.earnedTokenAddress, beefy.vaultABI, 'getPricePerFullShare', []));
        let underlyingBalance = balance * (exchangeRate / (10 ** decimals));
  
        // Native Token Vaults:
        if(!vault.tokenAddress) {
          if(vault.token === 'MATIC') {
            let newToken = await addToken(chain, project, 'staked', wmatic, underlyingBalance, wallet);
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
  
          // Curve Vaults:
          if(vault.platform === 'Curve') {
            let newToken = await addCurveToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
            let vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
  
          // Unique Vaults (3+ Assets):
          } else if(vault.assets.length > 2) {
            if(vault.platform === 'IronFinance') {
              let newToken = await addIronToken(chain, project, 'staked', vault.tokenAddress, underlyingBalance, wallet);
              let vaultAPY = apys[vault.id];
              if(vaultAPY) {
                newToken.info = {
                  apy: vaultAPY
                }
              }
              balances.push(newToken);
            }
    
          // LP Token Vaults:
          } else if(vault.assets.length === 2 && vault.platform != 'Kyber' && !vault.id.includes('jarvis')) {
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
export const getStakedBIFI = async (wallet: Address) => {
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