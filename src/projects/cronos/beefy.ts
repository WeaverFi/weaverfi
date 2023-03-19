
// Imports:
import { WeaverError } from '../../error';
import { minABI, beefy } from '../../ABIs';
import { query, multicallOneMethodQuery, addToken, addLPToken, parseBN, fetchData } from '../../functions';

// Type Imports:
import type { Chain, Address, URL, Token, LPToken, XToken, BeefyAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'cronos';
const project = 'beefy';
const staking: Address = '0x107Dbf9c9C0EF2Df114159e5C7DC2baf7C444cFF';
const bifi: Address = '0xe6801928061CDbE32AC5AD0634427E140EFd05F9';
const wcro: Address = '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23';
const apiURL: URL = 'https://api.beefy.finance';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  const balance: (Token | LPToken | XToken)[] = [];
  const vaultsData: BeefyAPIResponse[] = await fetchData(`${apiURL}/vaults`);
  const apyData: Record<string, number | null> = await fetchData(`${apiURL}/apy`);
  const vaults = vaultsData.filter(vault => vault.chain === 'cronos' && vault.status === 'active');
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
          if(vault.token === 'CRO') {
            const newToken = await addToken(chain, project, 'staked', wcro, underlyingBalance, wallet);
            const vaultAPY = apys[vault.id];
            if(vaultAPY) {
              newToken.info = {
                apy: vaultAPY
              }
            }
            balances.push(newToken);
          }
        } else {
    
          // LP Token Vaults:
          if(vault.assets.length === 2) {
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
    const newToken = await addToken(chain, project, 'unclaimed', wcro, pendingRewards, wallet, staking);
    balances.push(newToken);
  }
  return balances;
}