
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addDebtToken, parseBN } from '../../functions';
import type { Chain, Address, URL, Token, DebtToken, AaveAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'aave';
const addressProvider: Address = '0xb6A86025F0FE1862B372cb0ca18CE3EDe02A318f';
const incentives: Address = '0x01D83Fe6A10D2f2B7AF17034343746188272cAc9';
const addressProviderV3: Address = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';
const uiDataProviderV3: Address = '0xdBbFaFC45983B4659E368a3025b81f69Ab6E5093';
const dataProviderV3: Address = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
const incentivesV3: Address = '0x929EC64c34a17401F460460D4B9390518E5B473e';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
const apiURL: URL = 'https://aave-api-v2.aave.com/data/liquidity/v2';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    let markets: AaveAPIResponse[] = (await axios.get(`${apiURL}?poolId=${addressProvider}`)).data;
    balance.push(...(await getMarketBalances(markets, wallet)));
    balance.push(...(await getIncentives(wallet)));
    balance.push(...(await getMarketBalancesV3(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get lending market balances:
export const getMarketBalances = async (markets: AaveAPIResponse[], wallet: Address) => {

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
        let newToken = await addToken(chain, project, 'lent', market.underlyingAsset, balance, wallet);
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
          let newToken = await addDebtToken(chain, project, market.underlyingAsset, balance, wallet);
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

// Function to get unclaimed incentives:
export const getIncentives = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, incentives, aave.incentivesABI, 'getUserUnclaimedRewards', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', wavax, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get lending market V3 balances:
export const getMarketBalancesV3 = async (wallet: Address) => {

  // Initializations:
  let balances: (Token | DebtToken)[] = [];
  let queries: ContractCallContext[] = [];
  let assetsWithBalance: Address[] = [];

  // Fetching Assets:
  let assets: Address[] = await query(chain, uiDataProviderV3, aave.uiDataProviderABI, 'getReservesList', [addressProviderV3]);

  // Multicall Query Setup:
  let reserveDataQuery: ContractCallContext = {
    reference: 'userReserveData',
    contractAddress: dataProviderV3,
    abi: aave.dataProviderABI,
    calls: []
  }
  assets.forEach(asset => {
    reserveDataQuery.calls.push({ reference: asset, methodName: 'getUserReserveData', methodParameters: [asset, wallet] });
  });
  queries.push(reserveDataQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userReserveData'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let asset = result.reference as Address;
      let currentATokenBalance = parseBN(result.returnValues[0]);
      let currentStableDebt = parseBN(result.returnValues[1]);
      let currentVariableDebt = parseBN(result.returnValues[2]);
      let stableBorrowRate = parseBN(result.returnValues[5]);
      let liquidityRate = parseBN(result.returnValues[6]);

      // Lending Balances:
      if(currentATokenBalance > 0) {
        let newToken = await addToken(chain, project, 'lent', asset, currentATokenBalance, wallet);
        newToken.info = {
          apy: liquidityRate / (10 ** 25)
        }
        balances.push(newToken);
      }

      // Stable Borrowing Balances:
      if(currentStableDebt > 0) {
        let newToken = await addDebtToken(chain, project, asset, currentStableDebt, wallet);
        newToken.info = {
          apy: stableBorrowRate / (10 ** 25)
        }
        balances.push(newToken);
      }
  
      // Variable Borrowing Balances:
      if(currentVariableDebt > 0) {
        let newToken = await addDebtToken(chain, project, asset, currentVariableDebt, wallet);
        let extraData: { variableBorrowRate: number } = await query(chain, dataProviderV3, aave.dataProviderABI, 'getReserveData', [asset]);
        newToken.info = {
          apy: extraData.variableBorrowRate / (10 ** 25)
        }
        balances.push(newToken);
      }

      // Tracking Assets To Query Incentives For:
      if(currentATokenBalance > 0 || currentStableDebt > 0 || currentVariableDebt > 0) {
        assetsWithBalance.push(asset);
      }
    }
  })());
  await Promise.all(promises);
  balances.push(...(await getIncentivesV3(assetsWithBalance, wallet)));
  return balances;
}

// Function to get unclaimed V3 incentives:
export const getIncentivesV3 = async (assets: Address[], wallet: Address) => {
  if(assets.length > 0) {
    let tokens: Address[] = [];
    let promises = assets.map(asset => (async () => {
      let ibTokens: { aTokenAddress: Address, variableDebtTokenAddress: Address } = await query(chain, dataProviderV3, aave.dataProviderABI, 'getReserveTokensAddresses', [asset]);
      tokens.push(ibTokens.aTokenAddress);
      tokens.push(ibTokens.variableDebtTokenAddress);
    })());
    await Promise.all(promises);
    let rewards = parseInt(await query(chain, incentivesV3, aave.incentivesABI, 'getUserRewards', [tokens, wallet, wavax]));
    if(rewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', wavax, rewards, wallet);
      return [newToken];
    } else {
      return [];
    }
  } else {
    return [];
  }
}