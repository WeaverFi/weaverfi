
// Imports:
import { minABI, autofarm } from '../../ABIs';
import { query, addToken, addLPToken, addCurveToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'autofarm';
const registry: Address = '0x76b8c3ECdF99483335239e66F34191f11534cbAA';
const ignoredVaults: number[] = [75, 76, 87, 89, 93];

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
const getVaultBalances = async (wallet: Address) => {
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
        if(vaultID === 39 || vaultID === 40 || vaultID === 41 || vaultID === 66 || vaultID === 69) {
          let newToken = await addCurveToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
  
        // LP Token Vaults:
        } else if(symbol.includes('LP')) {
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