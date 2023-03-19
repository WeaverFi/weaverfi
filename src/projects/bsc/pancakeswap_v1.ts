
// Imports:
import { pancakeswap } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'pancakeswap_v1';
const registry: Address = '0x73feaa1eE314F8c655E354234017bE2193C9E24E';
const cake: Address = '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  balance.push(...(await getFarmBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getFarmBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let cakeRewards = 0;
  let poolLength = parseInt(await query(chain, registry, pancakeswap.registryABI, 'poolLength', []));
  let farms = [...Array(poolLength).keys()];

  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, registry, pancakeswap.registryABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, registry, pancakeswap.registryABI, 'poolInfo', [farmID]))[0];

        // Single-Asset Cake Farm:
        if(farmID === 0) {
          let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // All Other Farms:
        } else {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }

        // Pending Cake Rewards:
        let rewards = parseInt(await query(chain, registry, pancakeswap.registryABI, 'pendingCake', [farmID, wallet]));
        if(rewards > 0) {
          cakeRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(cakeRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', cake, cakeRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}