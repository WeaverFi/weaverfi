
// Imports:
import axios from 'axios';
import { minABI, aave } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, URL, Token, DebtToken, AaveAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'aave';
const addressProvider: Address = '0xd05e3E715d945B59290df0ae8eF85c1BdB684744';
const incentives: Address = '0x357D51124f59836DeD84c8a1730D72B749d8BC23';
const addressProviderV3: Address = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';
const uiDataProviderV3: Address = '0x8F1AD487C9413d7e81aB5B4E88B024Ae3b5637D0';
const dataProviderV3: Address = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
const incentivesV3: Address = '0x929EC64c34a17401F460460D4B9390518E5B473e';
const wmatic: Address = '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270';
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
  let balances: (Token | DebtToken)[] = [];
  let promises = markets.map(market => (async () => {

    // Lending Balances:
    let balance = parseInt(await query(chain, market.aTokenAddress, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addToken(chain, project, 'lent', market.underlyingAsset, balance, wallet);
      newToken.info = {
        apy: market.avg7DaysLiquidityRate * 100,
        deprecated: !market.isActive
      }
      balances.push(newToken);
    }

    // Variable Borrowing Balances:
    if(market.borrowingEnabled) {
      let variableDebt = parseInt(await query(chain, market.variableDebtTokenAddress, minABI, 'balanceOf', [wallet]));
      if(variableDebt > 0) {
        let newToken = await addDebtToken(chain, project, market.underlyingAsset, variableDebt, wallet);
        newToken.info = {
          apy: market.avg7DaysVariableBorrowRate * 100,
        }
        balances.push(newToken);
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
    let newToken = await addToken(chain, project, 'unclaimed', wmatic, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get lending market V3 balances:
export const getMarketBalancesV3 = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let assetsWithBalance: Address[] = [];
  let assets: Address[] = await query(chain, uiDataProviderV3, aave.uiDataProviderABI, 'getReservesList', [addressProviderV3]);
  let promises = assets.map(asset => (async () => {
    let data: { currentATokenBalance: number, currentStableDebt: number, currentVariableDebt: number, stableBorrowRate: number, liquidityRate: number } = await query(chain, dataProviderV3, aave.dataProviderABI, 'getUserReserveData', [asset, wallet]);
    
    // Lending Balances:
    if(data.currentATokenBalance > 0) {
      let newToken = await addToken(chain, project, 'lent', asset, data.currentATokenBalance, wallet);
      newToken.info = {
        apy: data.liquidityRate / (10 ** 25)
      }
      balances.push(newToken);
    }

    // Stable Borrowing Balances:
    if(data.currentStableDebt > 0) {
      let newToken = await addDebtToken(chain, project, asset, data.currentStableDebt, wallet);
      newToken.info = {
        apy: data.stableBorrowRate / (10 ** 25)
      }
      balances.push(newToken);
    }

    // Variable Borrowing Balances:
    if(data.currentVariableDebt > 0) {
      let newToken = await addDebtToken(chain, project, asset, data.currentVariableDebt, wallet);
      let extraData: { variableBorrowRate: number } = await query(chain, dataProviderV3, aave.dataProviderABI, 'getReserveData', [asset]);
      newToken.info = {
        apy: extraData.variableBorrowRate / (10 ** 25)
      }
      balances.push(newToken);
    }

    // Tracking Assets To Query Incentives For:
    if(data.currentATokenBalance > 0 || data.currentStableDebt > 0 || data.currentVariableDebt > 0) {
      assetsWithBalance.push(asset);
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