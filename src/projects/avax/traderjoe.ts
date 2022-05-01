
// Imports:
import { minABI, traderjoe } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addLPToken, addDebtToken, addTraderJoeToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, DebtToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'traderjoe';
const masterChefV2: Address = '0xd6a4F121CA35509aF06A0Be99093d08462f53052';
const masterChefV3: Address = '0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00';
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
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let balanceQuery: ContractCallContext = {
    reference: 'userInfo',
    contractAddress: masterChefV2,
    abi: traderjoe.masterChefABI,
    calls: []
  }
  farms.forEach(farmID => {
    balanceQuery.calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  queries.push(balanceQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userInfo'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let farmID = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
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
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let balanceQuery: ContractCallContext = {
    reference: 'userInfo',
    contractAddress: masterChefV3,
    abi: traderjoe.masterChefABI,
    calls: []
  }
  farms.forEach(farmID => {
    balanceQuery.calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  queries.push(balanceQuery);
  
  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userInfo'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let farmID = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
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

// Function to get market balance:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, bankController, traderjoe.bankControllerABI, 'getAllMarkets', []);
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  markets.forEach(market => {
    queries.push({
      reference: market,
      contractAddress: market,
      abi: minABI.concat(traderjoe.marketABI),
      calls: [
        { reference: 'marketBalance', methodName: 'balanceOf', methodParameters: [wallet] },
        { reference: 'accountSnapshot', methodName: 'getAccountSnapshot', methodParameters: [wallet] }
      ]
    });
  });

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = markets.map(market => (async () => {
    let marketBalanceResults = multicallResults[market].callsReturnContext.find(i => i.reference === 'marketBalance');
    let accountSnapshotResults = multicallResults[market].callsReturnContext.find(i => i.reference === 'accountSnapshot');
    if(marketBalanceResults && accountSnapshotResults && marketBalanceResults.success && accountSnapshotResults.success) {
      let balance = parseBN(marketBalanceResults.returnValues[0]);
      let debt = parseBN(accountSnapshotResults.returnValues[2]);
      let exchangeRate = parseBN(accountSnapshotResults.returnValues[3]);
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
  })());
  await Promise.all(promises);
  return balances;
}