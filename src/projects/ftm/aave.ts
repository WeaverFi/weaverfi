
// Imports:
import { aave } from '../../ABIs';
import { query, addToken, addDebtToken } from '../../functions';
import type { Chain, Address, Token, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'aave';
const addressProviderV3: Address = '0xa97684ead0e402dC232d5A977953DF7ECBaB3CDb';
const uiDataProviderV3: Address = '0x1CCbfeC508da8D5242D5C1b368694Ab0066b39f1';
const dataProviderV3: Address = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
const incentivesV3: Address = '0x929EC64c34a17401F460460D4B9390518E5B473e';
const wftm: Address = '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    balance.push(...(await getMarketBalancesV3(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

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
    let rewards = parseInt(await query(chain, incentivesV3, aave.incentivesABI, 'getUserRewards', [tokens, wallet, wftm]));
    if(rewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', wftm, rewards, wallet);
      return [newToken];
    } else {
      return [];
    }
  } else {
    return [];
  }
}