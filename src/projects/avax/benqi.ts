
// Imports:
import { utils } from 'ethers';
import { WeaverError } from '../../error';
import { minABI, benqi } from '../../ABIs';
import { query, multicallComplexQuery, addToken, addDebtToken, parseBN, defaultAddress, multicallOneContractQuery } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, DebtToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'benqi';
const controller: Address = '0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4';
const savax: Address = '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  balance.push(...(await getMarketBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getMarketBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all market balances and debt:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, controller, benqi.controllerABI, 'getAllMarkets', []);

  // Market Balance Multicall Query:
  let abi = minABI.concat(benqi.marketABI);
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
          let tokenAddress: Address = market.toLowerCase() === '0x5c0401e81bc07ca70fad469b451682c0d747ef1c' ? defaultAddress : await query(chain, market, benqi.marketABI, 'underlying', []);
  
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

// Function to get all liquid staked AVAX (sAVAX):
export const getLiquidStakingBalances = async (wallet: Address) => {
  let balances: Token[] = [];

  //Liquid Staking Balance Multicall Query:
  let abi = minABI.concat(benqi.liquidStakingABI);
  let calls: CallContext[] = [
    { reference: 'shareBalance', methodName: 'balanceOf', methodParameters: [wallet] },
    { reference: 'exchangeRate', methodName: 'getPooledAvaxByShares', methodParameters: [utils.parseEther('1')] }
  ];
  let multicallResults = await multicallOneContractQuery(chain, savax, abi, calls);
  let balanceResults = multicallResults['shareBalance'];
  let exchangeRateResults = multicallResults['exchangeRate'];
  if(balanceResults && exchangeRateResults) {
    let shareBalance = parseBN(balanceResults[0]);
    let exchangeRate = parseBN(exchangeRateResults[0]);
    if(shareBalance > 0) {
      let underlyingBalance = shareBalance * (exchangeRate / (10 ** 18));
      let newToken = await addToken(chain, project, 'staked', wavax, underlyingBalance, wallet, savax);
      balances.push(newToken);
    }
  }
  return balances;
}