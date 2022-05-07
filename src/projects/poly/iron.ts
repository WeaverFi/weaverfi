
// Imports:
import { minABI, iron } from '../../ABIs';
import { query, multicallOneContractQuery, multicallComplexQuery, addToken, addLPToken, addDebtToken, addXToken, addIronToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, DebtToken, XToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'iron';
const registry: Address = '0x1fD1259Fa8CdC60c6E8C86cfA592CA1b8403DFaD';
const lending: Address = '0xF20fcd005AFDd3AD48C85d0222210fe168DDd10c';
const blueice: Address = '0xB1Bf26c7B43D2485Fa07694583d2F17Df0DDe010';
const ice: Address = '0x4A81f8796e0c6Ad4877A51C86693B0dE8093F2ef';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken | XToken)[] = [];
  try {
    balance.push(...(await getFarmBalances(wallet)));
    balance.push(...(await getMarketBalances(wallet)));
    balance.push(...(await getMarketRewards(wallet)));
    balance.push(...(await getStakedICE(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, registry, iron.registryABI, 'poolLength', []));
  let farms = [...Array(poolCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, registry, iron.registryABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let lpToken = await query(chain, registry, iron.registryABI, 'lpToken', [farmID]);

        // Iron LP Tokens:
        if(farmID === 0 || farmID === 3) {
          let newToken = await addIronToken(chain, project, 'staked', lpToken, balance, wallet);
          balances.push(newToken);
  
        // Other LP Tokens:
        } else {
          let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
          balances.push(newToken);
        }
  
        // Pending ICE Rewards:
        let rewards = parseInt(await query(chain, registry, iron.registryABI, 'pendingReward', [farmID, wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', ice, rewards, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all market balances and debt:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, lending, iron.lendingABI, 'getAllMarkets', []);

  // Market Balance Multicall Query:
  let abi = minABI.concat(iron.marketABI);
  let calls: CallContext[] = [
    { reference: 'marketBalance', methodName: 'balanceOf', methodParameters: [wallet] },
    { reference: 'accountSnapshot', methodName: 'getAccountSnapshot', methodParameters: [wallet] }
  ];
  let multicallResults = await multicallComplexQuery(chain, markets, abi, calls);
  let promises = markets.map(market => (async () => {
    let marketResults = multicallResults[market];
    if(marketResults) {
      let marketBalanceResults = marketResults['marketBalance'];
      let accountSnapshotResults = marketResults['accountSnapshot'];
      if(marketBalanceResults && accountSnapshotResults) {
        let balance = parseBN(marketBalanceResults[0]);
        let debt = parseBN(accountSnapshotResults[2]);
        let exchangeRate = parseBN(accountSnapshotResults[3]);
        if(balance > 0 || debt > 0) {
          let tokenAddress: Address = market.toLowerCase() === '0xca0f37f73174a28a64552d426590d3ed601ecca1' ? defaultAddress : await query(chain, market, iron.marketABI, 'underlying', []);
  
          // Lending Balances:
          if(balance > 0) {
            let underlyingBalance = balance * (exchangeRate / (10 ** 18));
            let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
            balances.push(newToken);
          }
    
          // Borrowing Balances:
          if(debt > 0) {
            let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
            balances.push(newToken);
          }
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all market rewards:
export const getMarketRewards = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, lending, iron.lendingABI, 'rewardAccrued', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', ice, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked ICE balance:
export const getStakedICE = async (wallet: Address) => {
  let balance = parseInt(await query(chain, blueice, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let locked = await query(chain, blueice, iron.stakingABI, 'locked', [wallet]);
    let newToken = await addXToken(chain, project, 'staked', blueice, balance, wallet, ice, parseInt(locked.amount));
    newToken.info = {
      unlock: parseInt(locked.end)
    }
    return [newToken];
  } else {
    return [];
  }
}