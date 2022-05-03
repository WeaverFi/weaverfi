
// Imports:
import axios from 'axios';
import { moonpot } from '../../ABIs';
import { multicallQuery, addToken, addLPToken, add4BeltToken, addBeltToken, addAlpacaToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, LPToken, XToken, MoonPotAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'moonpot';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  try {
    let pots: MoonPotAPIResponse[] = [];
    let potsData: Record<string, MoonPotAPIResponse> = (await axios.get('https://api.moonpot.com/pots')).data.data;
    let potsKeys = Object.keys(potsData).filter(pot => potsData[pot].status === 'active');
    potsKeys.forEach(key => {
      pots.push(potsData[key]);
    });
    balance.push(...(await getPotBalances(wallet, pots)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pot balances:
export const getPotBalances = async (wallet: Address, pots: MoonPotAPIResponse[]) => {
  let balances: (Token | LPToken | XToken)[] = [];
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  pots.forEach(pot => {
    queries.push({
      reference: pot.contractAddress,
      contractAddress: pot.contractAddress,
      abi: moonpot.potABI,
      calls: [{ reference: 'balance', methodName: 'userTotalBalance', methodParameters: [wallet] }]
    });
  });

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = pots.map(pot => (async () => {
    let balanceResult = multicallResults[pot.contractAddress].callsReturnContext[0];
    if(balanceResult.success) {
      let balance = parseBN(balanceResult.returnValues[0]);
      if(balance > 0) {

        // 4Belt Pot:
        if(pot.token.includes('4Belt')) {
          let newToken = await add4BeltToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
          balances.push(newToken);

        // Belt Pots:
        } else if(pot.token.startsWith('belt')) {
          let newToken = await addBeltToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
          balances.push(newToken);

        // Alpaca Pots:
        } else if(pot.token.startsWith('ib')) {
          let newToken = await addAlpacaToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
          balances.push(newToken);

        // LP Pots:
        } else if(pot.token.endsWith('LP')) {
          let newToken = await addLPToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
          balances.push(newToken);

        // Single-Asset Pots:
        } else {
          let newToken = await addToken(chain, project, 'staked', pot.tokenAddress, balance, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}