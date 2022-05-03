
// Imports:
import { minABI, scream } from '../../ABIs';
import { query, multicallQuery, addToken, addDebtToken, addXToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, DebtToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'scream';
const controller: Address = '0x260E596DAbE3AFc463e75B6CC05d8c46aCAcFB09';
const screamToken: Address = '0xe0654C8e6fd4D733349ac7E09f6f23DA256bF475';
const xscream: Address = '0xe3D17C7e840ec140a7A51ACA351a482231760824';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken | XToken)[] = [];
  try {
    balance.push(...(await getMarketBalances(wallet)));
    balance.push(...(await getStakedSCREAM(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all market balances and debt:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, controller, scream.controllerABI, 'getAllMarkets', []);
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  markets.forEach(market => {
    queries.push({
      reference: market,
      contractAddress: market,
      abi: minABI.concat(scream.marketABI),
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
        let tokenAddress = await query(chain, market, scream.marketABI, 'underlying', []);

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
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked SCREAM balance:
export const getStakedSCREAM = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xscream, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = parseInt(await query(chain, xscream, scream.stakingABI, 'getShareValue', [])) / (10 ** 18);
    let newToken = await addXToken(chain, project, 'unclaimed', xscream, balance, wallet, screamToken, balance * exchangeRate);
    return [newToken];
  } else {
    return [];
  }
}