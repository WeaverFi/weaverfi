
// Imports:
import { minABI, autofarm } from '../../ABIs';
import { query, addToken, addLPToken, addTraderJoeToken } from '../../functions';
import type { Chain, Address, Token, LPToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'autofarm';
const registry: Address = '0x864A0B7F8466247A0e44558D29cDC37D4623F213';
const ignoredVaults: number[] = [67, 77, 79];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
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
  let balances: (Token | LPToken | XToken)[] = [];
  let poolLength = parseInt(await query(chain, registry, autofarm.registryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  let promises = vaults.map(vaultID => (async () => {
    if(!ignoredVaults.includes(vaultID)) {
      let balance = parseInt(await query(chain, registry, autofarm.registryABI, 'stakedWantTokens', [vaultID, wallet]));
      if(balance > 99) {
        let token = (await query(chain, registry, autofarm.registryABI, 'poolInfo', [vaultID]))[0];
        let symbol = await query(chain, token, minABI, 'symbol', []);
  
        // xJOE Vault:
        if(vaultID === 17) {
          let newToken = await addTraderJoeToken(chain, project, 'staked', balance, wallet);
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