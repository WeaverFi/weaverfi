
// Imports:
import { addCurveToken } from '../../project-functions';
import { minABI, apwine, paladin, aave, harvest, yearn, paraswap, truefi } from '../../ABIs';
import { query, multicallOneContractQuery, multicallOneMethodQuery, addToken, addXToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, XToken, CallContext } from '../../types';

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