
// Imports:
import { minABI, apwine, aave, harvest, balancer, beefy } from '../../ABIs';
import { query, multicallQuery, addToken, addLPToken, addCurveToken, addBalancerToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'apwine';
const registry: Address = '0x72d15EAE2Cd729D8F2e41B1328311f3e275612B9';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getFutureBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get future balances:
export const getFutureBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolLength = parseInt(await query(chain, registry, apwine.registryABI, 'futureVaultCount', []));
  let futures = [...Array(poolLength).keys()];
  
  // Future Multicall Query Setup:
  let futureQueries: ContractCallContext[] = [];
  let futureQuery: ContractCallContext = {
    reference: 'getFutureVaultAt',
    contractAddress: registry,
    abi: apwine.registryABI,
    calls: []
  }
  futures.forEach(futureID => {
    futureQuery.calls.push({ reference: futureID.toString(), methodName: 'getFutureVaultAt', methodParameters: [futureID] });
  });
  futureQueries.push(futureQuery);

  // Future Multicall Query Results:
  let futureMulticallResults = (await multicallQuery(chain, futureQueries)).results;

  // PT Multicall Query Setup:
  let ptQueries: ContractCallContext[] = [];
  futureMulticallResults['getFutureVaultAt'].callsReturnContext.forEach(result => {
    if(result.success) {
      let future = result.returnValues[0] as Address;
      ptQueries.push({
        reference: future,
        contractAddress: future,
        abi: apwine.futureABI,
        calls: [{ reference: 'ptAddress', methodName: 'getPTAddress', methodParameters: [] }]
      });
    }
  });

  // PT Multicall Query Results:
  let ptMulticallResults = (await multicallQuery(chain, ptQueries)).results;

  // Balance Multicall Query Setup:
  let balanceQueries: ContractCallContext[] = [];
  let pt_promises = Object.keys(ptMulticallResults).map(result => (async () => {
    let ptResult = ptMulticallResults[result].callsReturnContext[0];
    if(ptResult.success) {
      let future = ptMulticallResults[result].originalContractCallContext.reference as Address;
      let pt = ptResult.returnValues[0] as Address;
      balanceQueries.push({
        reference: future,
        contractAddress: pt,
        abi: minABI,
        calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
      });
    }
  })());
  await Promise.all(pt_promises);

  // Balance Multicall Query Results:
  let balanceMulticallResults = (await multicallQuery(chain, balanceQueries)).results;
  let promises = Object.keys(balanceMulticallResults).map(result => (async () => {
    let balanceResult = balanceMulticallResults[result].callsReturnContext[0];
    if(balanceResult.success) {
      let future = balanceMulticallResults[result].originalContractCallContext.reference as Address;
      let ptBalance = parseBN(balanceResult.returnValues[0]);
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
            let poolID = await query(chain, futureToken, balancer.poolABI, 'getPoolId', []);
            let newToken = await addBalancerToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet, poolID);
            balances.push(newToken);
          } else {
            console.warn(`Unsupported Harvest Future on APWine: ${future}`);
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
          } else {
            console.warn(`Unsupported Beefy Future on APWine: ${future}`);
          }

        // StakeDAO Futures:
        } else if(platform === 'StakeDAO') {
          console.warn(`Unsupported StakeDAO Future on APWine: ${future}`);
        } else {
          console.warn(`Unidentified APWine Future Platform: ${platform}`);
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