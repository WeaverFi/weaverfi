
// Imports:
import { autofarm } from '../../ABIs';
import { query, addLPToken } from '../../functions';
import type { Chain, Address, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'one';
const project = 'autofarm';
const registry: Address = '0x67da5f2ffaddff067ab9d5f025f8810634d84287';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: LPToken[] = [];
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
  let balances: LPToken[] = [];
  let poolLength = parseInt(await query(chain, registry, autofarm.oneRegistryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  let promises = vaults.map(vaultID => (async () => {
    let balance = parseInt(await query(chain, registry, autofarm.oneRegistryABI, 'userInfo', [vaultID, wallet]));
    if(balance > 99) {
      let lpToken = await query(chain, registry, autofarm.oneRegistryABI, 'lpToken', [vaultID]);
      let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}