
// Imports:
import { WeaverError } from '../../error';
import { minABI, apeswap } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'apeswap';
const masterApe: Address = '0x54aff400858Dcac39797a81894D9920f16972D1D';
const vaultMaster: Address = '0x37ac7DE40A6fd71FD1559Aa00F154E8dcb72efdb';
const banana: Address = '0x5d47baba0d66083c52009271faf3f50dcc01023c';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  balance.push(...(await getFarmBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getFarmBalances()', err) })));
  balance.push(...(await getVaultBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getVaultBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let bananaRewards = 0;
  let farmCount = parseInt(await query(chain, masterApe, apeswap.polyMasterApeABI, 'poolLength', []));
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
        let lpToken = await query(chain, masterApe, apeswap.polyMasterApeABI, 'lpToken', [farmID]);
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);

        // Pending BANANA Rewards:
        let rewards = parseInt(await query(chain, masterApe, apeswap.polyMasterApeABI, 'pendingBanana', [farmID, wallet]));
        if(rewards > 0) {
          bananaRewards += rewards;
        }

        // Bonus Rewards:
        let rewarder = await query(chain, masterApe, apeswap.polyMasterApeABI, 'rewarder', [farmID]);
        let bonusRewards = parseInt(await query(chain, rewarder, apeswap.rewarderABI, 'pendingToken', [farmID, wallet]));
        if(bonusRewards > 0) {
          let token = await query(chain, rewarder, apeswap.rewarderABI, 'rewardToken', []);
          let newToken = await addToken(chain, project, 'unclaimed', token, bonusRewards, wallet);
          balances.push(newToken);
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