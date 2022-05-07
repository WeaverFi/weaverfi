
// Imports:
import { autofarm } from '../../ABIs';
import { query, multicallOneContractQuery, addLPToken, parseBN } from '../../functions';
import type { Chain, Address, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'one';
const project = 'autofarm';
const registry: Address = '0x67da5f2ffaddff067ab9d5f025f8810634d84287';
const ignoredVaults: number[] = [];

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
export const getVaultBalances = async (wallet: Address) => {
  let balances: LPToken[] = [];
  let poolLength = parseInt(await query(chain, registry, autofarm.oneRegistryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  vaults.forEach(vaultID => {
    if(!ignoredVaults.includes(vaultID)) {
      calls.push({ reference: vaultID.toString(), methodName: 'userInfo', methodParameters: [vaultID, wallet] });
    }
  });
  let multicallResults = await multicallOneContractQuery(chain, registry, autofarm.oneRegistryABI, calls);
  let promises = vaults.map(vaultID => (async () => {
    let userInfoResults = multicallResults[vaultID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 99) {
        let lpToken = await query(chain, registry, autofarm.oneRegistryABI, 'lpToken', [vaultID]);
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}