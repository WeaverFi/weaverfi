
// Imports:
import { WeaverError } from '../../error';
import { minABI, apwine, aave, harvest, beefy } from '../../ABIs';
import { addCurveToken, addBalancerToken } from '../../project-functions';
import { query, multicallOneContractQuery, multicallOneMethodQuery, addToken, addLPToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'apwine';
const registry: Address = '0x72d15EAE2Cd729D8F2e41B1328311f3e275612B9';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  balance.push(...(await getFutureBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getFutureBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get future balances:
export const getFutureBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolLength = parseInt(await query(chain, registry, apwine.registryABI, 'futureVaultCount', []));
  let futures = [...Array(poolLength).keys()];
  
  // Future Multicall Query:
  let calls: CallContext[] = [];
  futures.forEach(futureID => {
    calls.push({ reference: futureID.toString(), methodName: 'getFutureVaultAt', methodParameters: [futureID] });
  });
  let futureMulticallResults = await multicallOneContractQuery(chain, registry, apwine.registryABI, calls);
    
  // PT Multicall Query:
  let futureAddresses: Address[] = Object.keys(futureMulticallResults).map(id => futureMulticallResults[id][0]);
  let ptMulticallResults = await multicallOneMethodQuery(chain, futureAddresses, apwine.futureABI, 'getPTAddress', []);
  
  // Balance Multicall Query:
  let ptAddresses: Address[] = Object.keys(ptMulticallResults).map(future => ptMulticallResults[future as Address][0]);
  let balanceMulticallResults = await multicallOneMethodQuery(chain, ptAddresses, minABI, 'balanceOf', [wallet]);
  let promises = futureAddresses.map(future => (async () => {
    let ptAddress: Address = ptMulticallResults[future][0];
    let balanceResults = balanceMulticallResults[ptAddress];
    if(balanceResults) {
      let ptBalance = parseBN(balanceResults[0]);
      if(ptBalance > 0) {
        let platform = await query(chain, future, apwine.futureABI, 'PLATFORM_NAME', []);
        let futureToken = await query(chain, future, apwine.futureABI, 'getIBTAddress', []);

        // Aave Futures:
        if(platform === 'Aave') {
          let underlyingToken = await query(chain, futureToken, aave.lendingABI, 'UNDERLYING_ASSET_ADDRESS', []);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', underlyingToken, ptBalance + fytBalance, wallet);
          balances.push(newToken);

        // Harvest Futures:
        } else if(platform === 'Harvest') {
          let underlyingToken = await query(chain, futureToken, harvest.stakingABI, 'underlying', []);
          let underlyingExchangeRate = parseInt(await query(chain, futureToken, harvest.stakingABI, 'getPricePerFullShare', [])) / (10 ** 18);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          if(underlyingToken.toLowerCase() === '0xdde43710defef6cbcf820b18debfc3cf9a4f449f') { // 4eur-f
            let newToken = await addCurveToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          } else if(underlyingToken.toLowerCase() === '0x002fbb34646c32fce6bb1d973b7585e62eee6aa9') { // BP-BTC-SP
            let newToken = await addBalancerToken(chain, project, 'staked', futureToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          }

        // Beefy Futures:
        } else if(platform === 'Beefy') {
          let underlyingToken = await query(chain, futureToken, beefy.vaultABI, 'want', []);
          let underlyingExchangeRate = parseInt(await query(chain, futureToken, beefy.vaultABI, 'getPricePerFullShare', [])) / (10 ** 18);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          if(underlyingToken.toLowerCase() === '0xdad97f7713ae9437fa9249920ec8507e5fbb23d3') { // crvUSDBTCETH
            let newToken = await addCurveToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          } else if(underlyingToken.toLowerCase() === '0xe8dcea7fb2baf7a9f4d9af608f06d78a687f8d9a') { // 2jpy-f
            let newToken = await addCurveToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          } else if(underlyingToken.toLowerCase() === '0xad326c253a84e9805559b73a08724e11e49ca651') { // 4eur-f
            let newToken = await addCurveToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          } else if(underlyingToken.toLowerCase() === '0x160532d2536175d65c03b97b0630a9802c274dad') { // UNI-V2
            let newToken = await addLPToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          }
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to fetch FYT Balances for any future:
const fetchFYTBalance = async (wallet: Address, future: Address, futureToken: Address) => {
  let balance = 0;
  let currentPeriod = parseInt(await query(chain, future, apwine.futureABI, 'getCurrentPeriodIndex', []));
  for(let period = 1; period <= currentPeriod; period++) {
    let fyt = await query(chain, future, apwine.futureABI, 'getFYTofPeriod', [period]);
    let fytBalance = parseInt(await query(chain, fyt, minABI, 'balanceOf', [wallet]));
    if(fytBalance > 0) {
      let futureTokenDecimals = parseInt(await query(chain, futureToken, minABI, 'decimals', []));
      let unrealisedYield = parseInt(await query(chain, future, apwine.futureABI, 'getUnrealisedYieldPerPT', [])) / (10 ** futureTokenDecimals);
      if(unrealisedYield > 0) {
        let intermediateRate = parseInt(await query(chain, future, apwine.futureABI, 'getIBTRate', [])) / (10 ** futureTokenDecimals);
        let exchangeRate = unrealisedYield * intermediateRate;
        let actualFytBalance = fytBalance * exchangeRate;
        balance += actualFytBalance;
      }
    }
  }
  return balance;
}