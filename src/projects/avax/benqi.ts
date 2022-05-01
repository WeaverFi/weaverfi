
// Imports:
import { minABI, benqi } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addDebtToken, parseBN } from '../../functions';
import type { Chain, Address, Token, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'benqi';
const controller: Address = '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    balance.push(...(await getMarketBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all market balances and debt:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, controller, benqi.controllerABI, 'getAllMarkets', []);

  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  markets.forEach(market => {
    queries.push({
      reference: market,
      contractAddress: market,
      abi: minABI.concat(benqi.marketABI),
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
        let tokenAddress: Address;
        if(market.toLowerCase() === '0x5C0401e81Bc07Ca70fAD469b451682c0d747Ef1c'.toLowerCase()) {
          tokenAddress = defaultAddress;
        } else {
          tokenAddress = await query(chain, market, benqi.marketABI, 'underlying', []);
        }

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