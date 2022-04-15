
// Imports:
import { minABI, autofarm } from '../../ABIs';
import { query, addToken, addLPToken, addCurveToken, addBZXToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'autofarm';
const registry: Address = '0x89d065572136814230a55ddeeddec9df34eb0b76';
const ignoredVaults: number[] = [];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getVaultBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all vault balances:
export const getVaultBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolLength = parseInt(await query(chain, registry, autofarm.registryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  let promises = vaults.map(vaultID => (async () => {
    if(!ignoredVaults.includes(vaultID)) {
      let balance = parseInt(await query(chain, registry, autofarm.registryABI, 'stakedWantTokens', [vaultID, wallet]));
      if(balance > 99) {
        let token = (await query(chain, registry, autofarm.registryABI, 'poolInfo', [vaultID]))[0];
        let symbol = await query(chain, token, minABI, 'symbol', []);
  
        // Curve Vaults:
        if(vaultID === 66 || vaultID === 97 || vaultID === 98) {
          let newToken = await addCurveToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
  
        // BZX I-Token Vaults:
        } else if(vaultID > 58 && vaultID < 66) {
          let newToken = await addBZXToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
  
        // LP Token Vaults:
        } else if(symbol.includes('LP') || symbol === 'UNI-V2') {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
  
        // Single-Asset Vaults:
        } else {
          let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}