
// Imports:
import { minABI, apwine, paladin, aave, harvest, yearn, paraswap, truefi } from '../../ABIs';
import { query, multicallQuery, addToken, addXToken, addCurveToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, LPToken, XToken } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'apwine';
const registry: Address = '0x72d15EAE2Cd729D8F2e41B1328311f3e275612B9';
const apw: Address = '0x4104b135DBC9609Fc1A9490E61369036497660c8';
const veapw: Address = '0xC5ca1EBF6e912E49A6a70Bb0385Ea065061a4F09';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  try {
    balance.push(...(await getStakedAPW(wallet)));
    balance.push(...(await getFutureBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get staked APW balance:
export const getStakedAPW = async (wallet: Address) => {
  let balance = parseInt(await query(chain, veapw, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let locked = await query(chain, veapw, apwine.stakingABI, 'locked', [wallet]);
    let newToken = await addXToken(chain, project, 'staked', veapw, balance, wallet, apw, parseInt(locked.amount));
    newToken.info = {
      unlock: parseInt(locked.end)
    }
    return [newToken];
  } else {
    return [];
  }
}

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
  Object.keys(ptMulticallResults).forEach(result => {
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
  });

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
        
        // StakeDAO Futures:
        if(platform === 'StakeDAO') {
          if(futureToken.toLowerCase() === '0xac14864ce5a98af3248ffbf549441b04421247d3') { // xSDT
            let underlyingToken: Address = '0x73968b9a57c6E53d41345FD57a6E6ae27d6CDB2F'; // SDT
            let stakedSupply = parseInt(await query(chain, futureToken, minABI, 'totalSupply', []));
            let underlyingTokenStaked = parseInt(await query(chain, underlyingToken, minABI, 'balanceOf', [futureToken]));
            let underlyingExchangeRate = underlyingTokenStaked / stakedSupply;
            let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
            let newToken = await addToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          } else {
            console.warn(`Unsupported StakeDAO Future on APWine: ${future}`);
          }

        // IDLE Finance Futures:
        } else if(platform === 'IDLE Finance') {
          console.warn(`Unsupported IDLE Finance Future on APWine: ${future}`);

        // Lido Futures:
        } else if(platform === 'Lido') {
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', futureToken, ptBalance + fytBalance, wallet);
          balances.push(newToken);

        // Yearn Futures:
        } else if(platform === 'Yearn') {
          if(futureToken.toLowerCase() === '0xe537b5cc158eb71037d4125bdd7538421981e6aa') { // yvCurve-3Crypto
            let underlyingToken = await query(chain, futureToken, yearn.vaultABI, 'token', []);
            let underlyingExchangeRate = parseInt(await query(chain, futureToken, yearn.vaultABI, 'pricePerShare', [])) / (10 ** 18);
            let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
            let newToken = await addCurveToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
            balances.push(newToken);
          } else {
            console.warn(`Unsupported Yearn Future on APWine: ${future}`);
          }

        // Harvest Futures:
        } else if(platform === 'Harvest') {
          let underlyingToken = await query(chain, futureToken, harvest.stakingABI, 'underlying', []);
          let underlyingExchangeRate = parseInt(await query(chain, futureToken, harvest.stakingABI, 'getPricePerFullShare', [])) / (10 ** 18);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
          balances.push(newToken);

        // TrueFi Futures:
        } else if(platform === 'TrueFi') {
          let underlyingToken = await query(chain, futureToken, truefi.poolABI, 'token', []);
          let underlyingPoolValue = parseInt(await query(chain, futureToken, truefi.poolABI, 'poolValue', []));
          let underlyingSupply = parseInt(await query(chain, futureToken, minABI, 'totalSupply', []));
          let underlyingExchangeRate = underlyingPoolValue / underlyingSupply;
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
          balances.push(newToken);

        // Aave Futures:
        } else if(platform === 'Aave') {
          let underlyingToken = await query(chain, futureToken, aave.lendingABI, 'UNDERLYING_ASSET_ADDRESS', []);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', underlyingToken, ptBalance + fytBalance, wallet);
          balances.push(newToken);

        // Olympus Futures:
        } else if(platform === 'Olympus') {
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', futureToken, ptBalance + fytBalance, wallet);
          balances.push(newToken);

        // Sushi Futures:
        } else if(platform === 'Sushi') {
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', futureToken, ptBalance + fytBalance, wallet);
          balances.push(newToken);

        // Paladin Futures:
        } else if(platform === 'Paladin') {
          let pool = await query(chain, futureToken, paladin.tokenABI, 'palPool', []);
          let poolToken = await query(chain, pool, paladin.poolABI, 'underlying', []);
          let underlyingToken = await query(chain, poolToken, aave.stakingABI, 'STAKED_TOKEN', []);
          let underlyingExchangeRate = parseInt(await query(chain, pool, paladin.poolABI, 'exchangeRateStored', [])) / (10 ** 18);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
          balances.push(newToken);

        // ParaSwap Futures:
        } else if(platform === 'ParaSwap') {
          let underlyingToken: Address = '0xcAfE001067cDEF266AfB7Eb5A286dCFD277f3dE5'; // PSP
          let underlyingExchangeRate = parseInt(await query(chain, futureToken, paraswap.stakingABI, 'PSPForSPSP', [10 ** 6])) / (10 ** 6);
          let fytBalance = await fetchFYTBalance(wallet, future, futureToken);
          let newToken = await addToken(chain, project, 'staked', underlyingToken, (ptBalance + fytBalance) * underlyingExchangeRate, wallet);
          balances.push(newToken);
        } else {
          console.warn(`Unidentified APWine Future Platform: ${platform}`);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

/* ========================================================================================================================================================================= */

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