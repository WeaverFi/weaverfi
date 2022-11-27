
// Imports:
import { WeaverError } from '../../error';
import { minABI, aave } from '../../ABIs';
import { query, multicallQuery, multicallOneContractQuery, addToken, addDebtToken, parseBN, fetchData } from '../../functions';

// Type Imports:
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, URL, Token, DebtToken, AaveAPIResponse, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'aave';
const addressProviderV3: Address = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';
const uiDataProviderV3: Address = '0x7006e5a16E449123a3F26920746d03337ff37340';
const dataProviderV3: Address = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
const incentivesV3: Address = '0x929EC64c34a17401F460460D4B9390518E5B473e';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';

// Aave V2 Initializations (to be deprecated later):
const addressProviderV2: Address = '0xd05e3E715d945B59290df0ae8eF85c1BdB684744';
const incentivesV2: Address = '0x357D51124f59836DeD84c8a1730D72B749d8BC23';
const apiURL: URL = 'https://aave-api-v2.aave.com/data/liquidity/v2';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  let marketsV2: AaveAPIResponse[] = await fetchData(`${apiURL}?poolId=${addressProviderV2}`);
  if(marketsV2.length > 0) {
    balance.push(...(await getMarketBalancesV2(marketsV2, wallet).catch((err) => { throw new WeaverError(chain, project, 'getMarketBalancesV2()', err) })));
  }
  balance.push(...(await getIncentivesV2(wallet).catch((err) => { throw new WeaverError(chain, project, 'getIncentivesV2()', err) })));
  balance.push(...(await getMarketBalancesV3(wallet).catch((err) => { throw new WeaverError(chain, project, 'getMarketBalancesV3()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get V2 lending market balances:
export const getMarketBalancesV2 = async (markets: AaveAPIResponse[], wallet: Address) => {

  // Initializations:
  let balances: (Token | DebtToken)[] = [];
  let queries: ContractCallContext[] = [];

  // Multicall Query Setup:
  markets.forEach(market => {
    queries.push({
      reference: 'a' + market.symbol,
      contractAddress: market.aTokenAddress,
      abi: minABI,
      calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
    });
    if(market.borrowingEnabled) {
      queries.push({
        reference: 'vb' + market.symbol,
        contractAddress: market.variableDebtTokenAddress,
        abi: minABI,
        calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
      });
    }
  });

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = markets.map(market => (async () => {

    // Lending Balances:
    let marketLendingResults = multicallResults['a' + market.symbol].callsReturnContext[0];
    if(marketLendingResults.success) {
      let balance = parseBN(marketLendingResults.returnValues[0]);
      if(balance > 0) {
        let newToken = await addToken(chain, project, 'lent', market.underlyingAsset, balance, wallet, market.aTokenAddress);
        newToken.info = {
          apy: market.avg7DaysLiquidityRate * 100,
          deprecated: !market.isActive
        }
        balances.push(newToken);
      }
    }

    // Variable Borrowing Balances:
    if(market.borrowingEnabled) {
      let marketVariableBorrowingResults = multicallResults['vb' + market.symbol].callsReturnContext[0];
      if(marketVariableBorrowingResults.success) {
        let balance = parseBN(marketVariableBorrowingResults.returnValues[0]);
        if(balance > 0) {
          let newToken = await addDebtToken(chain, project, market.underlyingAsset, balance, wallet, market.aTokenAddress);
          newToken.info = {
            apy: market.avg7DaysVariableBorrowRate * 100,
          }
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get unclaimed V2 incentives:
export const getIncentivesV2 = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, incentivesV2, aave.incentivesABI, 'getUserUnclaimedRewards', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', wmatic, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get V3 lending market balances:
export const getMarketBalancesV3 = async (wallet: Address) => {

  // Initializations:
  let balances: (Token | DebtToken)[] = [];
  let ibTokens: Record<Address, { aTokenAddress: Address, variableDebtTokenAddress: Address }> = {};

  // Fetching Assets:
  let assets: Address[] = await query(chain, uiDataProviderV3, aave.uiDataProviderABI, 'getReservesList', [addressProviderV3]);

  // Market Balance Multicall Query:
  let calls: CallContext[] = [];
  assets.forEach(asset => {
    calls.push({ reference: asset, methodName: 'getUserReserveData', methodParameters: [asset, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, dataProviderV3, aave.dataProviderABI, calls);
  let promises = assets.map(asset => (async () => {
    let balanceResults = multicallResults[asset];
    if(balanceResults) {
      let currentATokenBalance = parseBN(balanceResults[0]);
      let currentStableDebt = parseBN(balanceResults[1]);
      let currentVariableDebt = parseBN(balanceResults[2]);
      let stableBorrowRate = parseBN(balanceResults[5]);
      let liquidityRate = parseBN(balanceResults[6]);
  
      // Finding Interest Bearing Token Addresses:
      if(currentATokenBalance > 0 || currentStableDebt > 0 || currentVariableDebt > 0) {
        if(!ibTokens[asset]) {
          ibTokens[asset] = await query(chain, dataProviderV3, aave.dataProviderABI, 'getReserveTokensAddresses', [asset]);
        }
      }

      // Lending Balances:
      if(currentATokenBalance > 0) {
        let newToken = await addToken(chain, project, 'lent', asset, currentATokenBalance, wallet, ibTokens[asset].aTokenAddress);
        newToken.info = {
          apy: liquidityRate / (10 ** 25)
        }
        balances.push(newToken);
      }
  
      // Stable Borrowing Balances:
      if(currentStableDebt > 0) {
        let newToken = await addDebtToken(chain, project, asset, currentStableDebt, wallet, ibTokens[asset].aTokenAddress);
        newToken.info = {
          apy: stableBorrowRate / (10 ** 25)
        }
        balances.push(newToken);
      }
  
      // Variable Borrowing Balances:
      if(currentVariableDebt > 0) {
        let newToken = await addDebtToken(chain, project, asset, currentVariableDebt, wallet, ibTokens[asset].aTokenAddress);
        let extraData: { variableBorrowRate: number } = await query(chain, dataProviderV3, aave.dataProviderABI, 'getReserveData', [asset]);
        newToken.info = {
          apy: extraData.variableBorrowRate / (10 ** 25)
        }
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  balances.push(...(await getIncentivesV3(ibTokens, wallet)));
  return balances;
}

// Function to get unclaimed V3 incentives:
export const getIncentivesV3 = async (ibTokens: Record<Address, { aTokenAddress: Address, variableDebtTokenAddress: Address }>, wallet: Address) => {
  if(Object.keys(ibTokens).length > 0) {
    let tokens: Address[] = [];
    for(let asset in ibTokens) {
      tokens.push(ibTokens[asset as Address].aTokenAddress);
      tokens.push(ibTokens[asset as Address].variableDebtTokenAddress);
    }
    let rewards = parseInt(await query(chain, incentivesV3, aave.incentivesABI, 'getUserRewards', [tokens, wallet, wmatic]));
    if(rewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', wmatic, rewards, wallet);
      return [newToken];
    } else {
      return [];
    }
  } else {
    return [];
  }
}