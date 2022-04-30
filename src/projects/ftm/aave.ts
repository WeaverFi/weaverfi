
// Imports:
import { aave } from '../../ABIs';
import { ContractCallContext } from 'ethereum-multicall';
import { query, multicallQuery, addToken, addDebtToken, parseBN } from '../../functions';
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