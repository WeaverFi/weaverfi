
// Imports:
import { minABI, spookyswap } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addLPToken, addSpookyToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'spookyswap';
const masterChef: Address = '0x2b2929E785374c651a81A63878Ab22742656DcDd';
const boo: Address = '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE';
const xboo: Address = '0xa48d959AE2E88f1dAA7D5F611E01908106dE7598';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
    balance.push(...(await getStakedBOO(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, masterChef, spookyswap.masterChefABI, 'poolLength', []));
  let poolList = [...Array(poolCount).keys()];
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let balanceQuery: ContractCallContext = {
    reference: 'userInfo',
    contractAddress: masterChef,
    abi: spookyswap.masterChefABI,
    calls: []
  }
  poolList.forEach(poolID => {
    balanceQuery.calls.push({ reference: poolID.toString(), methodName: 'userInfo', methodParameters: [poolID, wallet] });
  });
  queries.push(balanceQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userInfo'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let poolID = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChef, spookyswap.masterChefABI, 'poolInfo', [poolID])).lpToken;
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
        let rewards = parseInt(await query(chain, masterChef, spookyswap.masterChefABI, 'pendingBOO', [poolID, wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', boo, rewards, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked BOO:
export const getStakedBOO = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xboo, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addSpookyToken(chain, project, 'staked', balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}