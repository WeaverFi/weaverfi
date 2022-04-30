
// Imports:
import { minABI, alligator } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addLPToken, addXToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'alligator';
const factory: Address = '0xD9362AA8E0405C93299C573036E7FB4ec3bE1240';
const masterChef: Address = '0x2cB3FF6894a07A9957Cf6797a29218CEBE13F42f';
const gtr: Address = '0x43c812ba28cb061b1be7514145a15c9e18a27342';
const xgtr: Address = '0x32A948F018870548bEd7e888Cd97a257b700D4c6';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
    balance.push(...(await getFarmBalances(wallet)));
    balance.push(...(await getStakedGTR(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: LPToken[] = [];
  let poolCount = parseInt(await query(chain, factory, alligator.factoryABI, 'allPairsLength', []));
  let pools = [...Array(poolCount).keys()];

  // LP Token Multicall Query Setup:
  let lpTokenQueries: ContractCallContext[] = [];
  let lpTokenQuery: ContractCallContext = {
    reference: 'allPairs',
    contractAddress: factory,
    abi: alligator.factoryABI,
    calls: []
  }
  pools.forEach(poolID => {
    lpTokenQuery.calls.push({ reference: poolID.toString(), methodName: 'allPairs', methodParameters: [poolID] });
  });
  lpTokenQueries.push(lpTokenQuery);

  // LP Token Multicall Query Results:
  let lpTokenMulticallResults = (await multicallQuery(chain, lpTokenQueries)).results;

  // Balance Multicall Query Setup:
  let balanceQueries: ContractCallContext[] = [];
  lpTokenMulticallResults['allPairs'].callsReturnContext.forEach(result => {
    if(result.success) {
      let lpToken = result.returnValues[0] as Address;
      balanceQueries.push({
        reference: result.reference,
        contractAddress: lpToken,
        abi: minABI,
        calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
      });
    }
  });

  // Balance Multicall Query Results:
  let balanceMulticallResults = (await multicallQuery(chain, balanceQueries)).results;
  let promises = Object.keys(balanceMulticallResults).map(result => (async () => {
    let balanceResult = balanceMulticallResults[result].callsReturnContext[0];
    if(balanceResult.success) {
      let lpToken = balanceMulticallResults[result].originalContractCallContext.contractAddress as Address;
      let balance = parseBN(balanceResult.returnValues[0]);
      if(balance > 0) {
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken | XToken)[] = [];
  let farmCount = parseInt(await query(chain, masterChef, alligator.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];

  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let userInfoQuery: ContractCallContext = {
    reference: 'userInfo',
    contractAddress: masterChef,
    abi: alligator.masterChefABI,
    calls: []
  }
  farms.forEach(farmID => {
    userInfoQuery.calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  queries.push(userInfoQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userInfo'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let farmID = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChef, alligator.masterChefABI, 'poolInfo', [farmID])).lpToken;
        let symbol = await query(chain, token, minABI, 'symbol', []);

        // Standard LPs:
        if(symbol === 'ALP') {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // xGTR Farm:
        } else if(symbol === 'xGTR') {
          let gtrStaked = parseInt(await query(chain, gtr, minABI, 'balanceOf', [xgtr]));
          let xgtrSupply = parseInt(await query(chain, xgtr, minABI, 'totalSupply', []));
          let newToken = await addXToken(chain, project, 'staked', xgtr, balance, wallet, gtr, balance * (gtrStaked / xgtrSupply));
          balances.push(newToken);
        }

        // Pending Rewards:
        let rewards = parseInt((await query(chain, masterChef, alligator.masterChefABI, 'pendingTokens', [farmID, wallet])).pendingGtr);
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', gtr, rewards, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked GTR balance:
export const getStakedGTR = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xgtr, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let gtrStaked = parseInt(await query(chain, gtr, minABI, 'balanceOf', [xgtr]));
    let xgtrSupply = parseInt(await query(chain, xgtr, minABI, 'totalSupply', []));
    let newToken = await addXToken(chain, project, 'staked', xgtr, balance, wallet, gtr, balance * (gtrStaked / xgtrSupply));
    return [newToken];
  } else {
    return [];
  }
}