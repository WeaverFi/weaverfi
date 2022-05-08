
// Imports:
import { minABI, traderjoe } from '../../ABIs';
import { addTraderJoeToken } from '../../project-functions';
import { query, multicallOneContractQuery, multicallComplexQuery, addToken, addLPToken, addDebtToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, DebtToken, XToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'traderjoe';
const masterChefV2: Address = '0xd6a4F121CA35509aF06A0Be99093d08462f53052';
const masterChefV3: Address = '0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00';
const boostedMasterChef: Address = '0x4483f0b6e2F5486D06958C20f8C39A7aBe87bf8F';
const bankController: Address = '0xdc13687554205E5b89Ac783db14bb5bba4A1eDaC';
const joe: Address = '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd';
const xjoe: Address = '0x57319d41F71E81F3c65F2a47CA4e001EbAFd4F33';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken | XToken)[] = [];
  try {
    balance.push(...(await getStakedJOE(wallet)));
    balance.push(...(await getFarmV2Balances(wallet)));
    balance.push(...(await getFarmV3Balances(wallet)));
    balance.push(...(await getBoostedFarmBalances(wallet)));
    balance.push(...(await getMarketBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked JOE balance:
export const getStakedJOE = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xjoe, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addTraderJoeToken(chain, project, 'staked', balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get farm V2 balances:
export const getFarmV2Balances = async (wallet: Address) => {
  let balances: (Token | LPToken | XToken)[] = [];
  let farmCount = parseInt(await query(chain, masterChefV2, traderjoe.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];

  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChefV2, traderjoe.masterChefABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChefV2, traderjoe.masterChefABI, 'poolInfo', [farmID])).lpToken;

        // xJOE Farm:
        if(token === xjoe) {
          let newToken = await addTraderJoeToken(chain, project, 'staked', balance, wallet);
          balances.push(newToken);
  
        // LP Farms:
        } else {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }
  
        // JOE Rewards:
        let rewards = await query(chain, masterChefV2, traderjoe.masterChefABI, 'pendingTokens', [farmID, wallet]);
        let pendingJoe = parseInt(rewards.pendingJoe);
        if(pendingJoe > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', joe, pendingJoe, wallet);
          balances.push(newToken);
        }
  
        // Bonus Rewards:
        let pendingBonus = parseInt(rewards.pendingBonusToken);
        if(pendingBonus > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get farm V3 balances:
export const getFarmV3Balances = async (wallet: Address) => {
  let balances: (Token | LPToken | XToken)[] = [];
  let farmCount = parseInt(await query(chain, masterChefV3, traderjoe.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChefV3, traderjoe.masterChefABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChefV3, traderjoe.masterChefABI, 'poolInfo', [farmID])).lpToken;

        // xJOE Farm:
        if(token === xjoe) {
          let newToken = await addTraderJoeToken(chain, project, 'staked', balance, wallet);
          balances.push(newToken);

        // LP Farms:
        } else {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }

        // JOE Rewards:
        let rewards = await query(chain, masterChefV3, traderjoe.masterChefABI, 'pendingTokens', [farmID, wallet]);
        let pendingJoe = parseInt(rewards.pendingJoe);
        if(pendingJoe > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', joe, pendingJoe, wallet);
          balances.push(newToken);
        }

        // Bonus Rewards:
        let pendingBonus = parseInt(rewards.pendingBonusToken);
        if(pendingBonus > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get boosted farm balances:
export const getBoostedFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken | XToken)[] = [];
  let farmCount = parseInt(await query(chain, boostedMasterChef, traderjoe.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, boostedMasterChef, traderjoe.masterChefABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, boostedMasterChef, traderjoe.masterChefABI, 'poolInfo', [farmID])).lpToken;

        // xJOE Farm:
        if(token === xjoe) {
          let newToken = await addTraderJoeToken(chain, project, 'staked', balance, wallet);
          balances.push(newToken);

        // LP Farms:
        } else {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }

        // JOE Rewards:
        let rewards = await query(chain, boostedMasterChef, traderjoe.masterChefABI, 'pendingTokens', [farmID, wallet]);
        let pendingJoe = parseInt(rewards.pendingJoe);
        if(pendingJoe > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', joe, pendingJoe, wallet);
          balances.push(newToken);
        }

        // Bonus Rewards:
        let pendingBonus = parseInt(rewards.pendingBonusToken);
        if(pendingBonus > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get market balance:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, bankController, traderjoe.bankControllerABI, 'getAllMarkets', []);

  // Market Balance Multicall Query:
  let abi = minABI.concat(traderjoe.marketABI);
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
          let token = await query(chain, market, traderjoe.marketABI, 'underlying', []);
        
          // Lending Balances:
          if(balance > 0) {
            let underlyingBalance = balance * (exchangeRate / (10 ** 18));
            let newToken = await addToken(chain, project, 'lent', token, underlyingBalance, wallet);
            balances.push(newToken);
          }
    
          // Borrowing Balances:
          if(debt > 0) {
            let newToken = await addDebtToken(chain, project, token, debt, wallet);
            balances.push(newToken);
          }
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}