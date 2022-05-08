
// Imports:
import { minABI, apeswap } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'apeswap';
const masterApe: Address = '0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9';
const vaultMaster: Address = '0x5711a833C943AD1e8312A9c7E5403d48c717e1aa';
const banana: Address = '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getFarmBalances(wallet)));
    balance.push(...(await getVaultBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let bananaRewards = 0;
  let farmCount = parseInt(await query(chain, masterApe, apeswap.masterApeABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterApe, apeswap.masterApeABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {

        // BANANA Farm:
        if(farmID === 0) {
          let newToken = await addToken(chain, project, 'staked', banana, balance, wallet);
          balances.push(newToken);

        // LP Farms:
        } else {
          let lpToken = (await query(chain, masterApe, apeswap.masterApeABI, 'poolInfo', [farmID])).lpToken;
          let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
          balances.push(newToken);
        }

        // Pending BANANA Rewards:
        let rewards = parseInt(await query(chain, masterApe, apeswap.masterApeABI, 'pendingCake', [farmID, wallet]));
        if(rewards > 0) {
          bananaRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(bananaRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', banana, bananaRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get vault balances:
export const getVaultBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let vaultCount = parseInt(await query(chain, vaultMaster, apeswap.vaultMasterABI, 'poolLength', []));
  let vaults = [...Array(vaultCount).keys()];
  
  // Balance Multicall Query:
  let calls: CallContext[] = [];
  vaults.forEach(vaultID => {
    calls.push({ reference: vaultID.toString(), methodName: 'stakedWantTokens', methodParameters: [vaultID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, vaultMaster, apeswap.vaultMasterABI, calls);
  let promises = vaults.map(vaultID => (async () => {
    let balanceResults = multicallResults[vaultID];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 99) {
        let token = (await query(chain, vaultMaster, apeswap.vaultMasterABI, 'poolInfo', [vaultID])).want;
        let symbol = await query(chain, token, minABI, 'symbol', []);
        
        // LP Vaults:
        if(symbol.endsWith('LP')) {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // Other Vaults:
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