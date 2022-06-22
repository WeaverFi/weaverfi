
// Imports:
import { WeaverError } from '../../error';
import { minABI, platypus } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addXToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, XToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'platypus';
const masterChef: Address = '0x68c5f4374228BEEdFa078e77b5ed93C28a2f713E';
const factoryChef: Address = '0x7125B4211357d7C3a90F796c956c12c681146EbB';
const ptp: Address = '0x22d4002028f537599be9f666d1c4fa138522f9c8';
const vePTP: Address = '0x5857019c749147EEE22b1Fe63500F237F3c1B692';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | XToken)[] = [];
  balance.push(...(await getStakedPTP(wallet).catch((err) => { throw new WeaverError(chain, project, 'getStakedPTP()', err) })));
  balance.push(...(await getPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalances()', err) })));
  balance.push(...(await getFactoryPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getFactoryPoolBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked PTP balance:
export const getStakedPTP = async (wallet: Address) => {
  let underlyingBalance = parseInt(await query(chain, vePTP, platypus.stakingABI, 'getStakedPtp', [wallet]));
  if(underlyingBalance > 0) {
    let balance = parseInt(await query(chain, vePTP, minABI, 'balanceOf', [wallet]));
    let newToken = await addXToken(chain, project, 'staked', vePTP, balance, wallet, ptp, underlyingBalance, vePTP);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: Token[] = [];
  let poolCount = parseInt(await query(chain, masterChef, platypus.masterChefABI, 'poolLength', []));
  let pools = [...Array(poolCount).keys()];

  // User Info Multicall Query:
  let calls: CallContext[] = [];
  pools.forEach(poolID => {
    calls.push({ reference: poolID.toString(), methodName: 'userInfo', methodParameters: [poolID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChef, platypus.masterChefABI, calls);
  let promises = pools.map(poolID => (async () => {
    let userInfoResults = multicallResults[poolID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token: Address = (await query(chain, masterChef, platypus.masterChefABI, 'poolInfo', [poolID])).lpToken;
        let underlyingToken: Address = await query(chain, token, platypus.tokenABI, 'underlyingToken', []);
        let newToken = await addToken(chain, project, 'staked', underlyingToken, balance, wallet, masterChef);
        balances.push(newToken);

        // PTP Rewards:
        let rewards = await query(chain, masterChef, platypus.masterChefABI, 'pendingTokens', [poolID, wallet]);
        let pendingPTP = parseInt(rewards.pendingPtp);
        if(pendingPTP > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', ptp, pendingPTP, wallet, masterChef);
          balances.push(newToken);
        }
  
        // Bonus Rewards:
        let pendingBonus = parseInt(rewards.pendingBonusToken);
        if(pendingBonus > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet, masterChef);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get factory pool balances:
export const getFactoryPoolBalances = async (wallet: Address) => {
  let balances: Token[] = [];
  let poolCount = parseInt(await query(chain, factoryChef, platypus.factoryChefABI, 'poolLength', []));
  let pools = [...Array(poolCount).keys()];

  // User Info Multicall Query:
  let calls: CallContext[] = [];
  pools.forEach(poolID => {
    calls.push({ reference: poolID.toString(), methodName: 'userInfo', methodParameters: [poolID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, factoryChef, platypus.factoryChefABI, calls);
  let promises = pools.map(poolID => (async () => {
    let userInfoResults = multicallResults[poolID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token: Address = (await query(chain, factoryChef, platypus.factoryChefABI, 'poolInfo', [poolID])).lpToken;
        let underlyingToken: Address = await query(chain, token, platypus.tokenABI, 'underlyingToken', []);
        let newToken = await addToken(chain, project, 'staked', underlyingToken, balance, wallet, factoryChef);
        balances.push(newToken);

        // PTP Rewards:
        let rewards = await query(chain, factoryChef, platypus.factoryChefABI, 'pendingTokens', [poolID, wallet]);
        let pendingPTP = parseInt(rewards.pendingPtp);
        if(pendingPTP > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', ptp, pendingPTP, wallet, factoryChef);
          balances.push(newToken);
        }
  
        // Bonus Rewards:
        let pendingBonus = parseInt(rewards.pendingBonusToken);
        if(pendingBonus > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet, factoryChef);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}