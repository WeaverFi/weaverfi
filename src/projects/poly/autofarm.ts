
// Imports:
import { minABI, autofarm } from '../../ABIs';
import { query, multicallQuery, addToken, addLPToken, addCurveToken, addBZXToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
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

  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let balanceQuery: ContractCallContext = {
    reference: 'stakedWantTokens',
    contractAddress: registry,
    abi: autofarm.registryABI,
    calls: []
  }
  vaults.forEach(vaultID => {
    if(!ignoredVaults.includes(vaultID)) {
      balanceQuery.calls.push({ reference: vaultID.toString(), methodName: 'stakedWantTokens', methodParameters: [vaultID, wallet] });
    }
  });
  queries.push(balanceQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['stakedWantTokens'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let vaultID = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
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