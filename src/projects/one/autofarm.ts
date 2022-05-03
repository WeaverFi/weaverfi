
// Imports:
import { autofarm } from '../../ABIs';
import { query, multicallQuery, addLPToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, LPToken } from '../../types';

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

  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let balanceQuery: ContractCallContext = {
    reference: 'userInfo',
    contractAddress: registry,
    abi: autofarm.oneRegistryABI,
    calls: []
  }
  vaults.forEach(vaultID => {
    if(!ignoredVaults.includes(vaultID)) {
      balanceQuery.calls.push({ reference: vaultID.toString(), methodName: 'userInfo', methodParameters: [vaultID, wallet] });
    }
  });
  queries.push(balanceQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userInfo'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let vaultID = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
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