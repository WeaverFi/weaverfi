
// Imports:
import { aave } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, multicallOneContractQuery, addToken, addDebtToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, DebtToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'op';
const project = 'aave_v3';
const dataProvider: Address = '0x69FA688f1Dc47d4B5d8029D5a35FB7a548310654';
const incentives: Address = '0x929EC64c34a17401F460460D4B9390518E5B473e';
const op: Address = '0x4200000000000000000000000000000000000042';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  balance.push(...(await getMarketBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getMarketBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get lending market balances:
export const getMarketBalances = async (wallet: Address) => {

  // Initializations:
  let balances: (Token | DebtToken)[] = [];
  let ibTokens: Record<Address, { aTokenAddress: Address, stableDebtTokenAddress: Address, variableDebtTokenAddress: Address }> = {};

  // Fetching Assets:
  let assets: Address[] = (await query(chain, dataProvider, aave.dataProviderABI, 'getAllReservesTokens', [])).map((result: any) => result[1]);

  // Market Balance Multicall Query:
  let calls: CallContext[] = [];
  assets.forEach(asset => {
    calls.push({ reference: asset, methodName: 'getUserReserveData', methodParameters: [asset, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, dataProvider, aave.dataProviderABI, calls);
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
          ibTokens[asset] = await query(chain, dataProvider, aave.dataProviderABI, 'getReserveTokensAddresses', [asset]);
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
        let extraData: { variableBorrowRate: number } = await query(chain, dataProvider, aave.dataProviderABI, 'getReserveData', [asset]);
        newToken.info = {
          apy: extraData.variableBorrowRate / (10 ** 25)
        }
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  balances.push(...(await getIncentives(ibTokens, wallet)));
  return balances;
}

// Function to get unclaimed incentives:
export const getIncentives = async (ibTokens: Record<Address, { aTokenAddress: Address, variableDebtTokenAddress: Address }>, wallet: Address) => {
  if(Object.keys(ibTokens).length > 0) {
    let tokens: Address[] = [];
    for(let asset in ibTokens) {
      tokens.push(ibTokens[asset as Address].aTokenAddress);
      tokens.push(ibTokens[asset as Address].variableDebtTokenAddress);
    }
    let rewards = parseInt(await query(chain, incentives, aave.incentivesABI, 'getUserRewards', [tokens, wallet, op]));
    if(rewards > 0) {
      let newToken = await addToken(chain, project, 'unclaimed', op, rewards, wallet);
      return [newToken];
    } else {
      return [];
    }
  } else {
    return [];
  }
}