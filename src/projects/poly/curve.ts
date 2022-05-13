
// Imports:
import { WeaverError } from '../../error';
import { minABI, curve } from '../../ABIs';
import { addCurveToken } from '../../project-functions';
import { query, multicallOneContractQuery, multicallOneMethodQuery, addToken, parseBN, zero } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'curve';
const registry: Address = '0x094d12e5b541784701FD8d65F11fc0598FBC6332';
const cryptoRegistry: Address = '0x47bB542B9dE58b970bA50c9dae444DDB4c16751a';
const factory: Address = '0x722272D36ef0Da72FF51c5A65Db7b870E2e8D4ee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  balance.push(...(await getPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalances()', err) })));
  balance.push(...(await getCryptoPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getCryptoPoolBalances()', err) })));
  balance.push(...(await getFactoryPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getFactoryPoolBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolAddresses = await getPoolAddresses(registry);

  // Initializing Multicalls:
  let lpCalls: CallContext[] = [];
  let gaugeCalls: CallContext[] = [];
  poolAddresses.forEach(poolAddress => { lpCalls.push({ reference: poolAddress, methodName: 'get_lp_token', methodParameters: [poolAddress] }); });
  poolAddresses.forEach(poolAddress => { gaugeCalls.push({ reference: poolAddress, methodName: 'get_gauges', methodParameters: [poolAddress] }); });
  
  // LP Token Balances:
  let lpMulticallResults = await multicallOneContractQuery(chain, registry, curve.registryABI, lpCalls);
  let lpTokens = Object.keys(lpMulticallResults).map(pool => lpMulticallResults[pool][0]) as Address[];
  balances.push(...(await getLPTokenBalances(lpTokens, wallet)));
  
  // Gauge Balances:
  let gaugeMulticallResults = await multicallOneContractQuery(chain, registry, curve.registryABI, gaugeCalls);
  let gauges = (Object.keys(gaugeMulticallResults).map(pool => gaugeMulticallResults[pool][0][0]) as Address[]).filter(gauge => gauge != zero);
  balances.push(...(await getGaugeBalances(gauges, wallet)));

  return balances;
}

// Function to get crypto pool balances:
export const getCryptoPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolAddresses = await getPoolAddresses(cryptoRegistry);

  // Initializing Multicalls:
  let lpCalls: CallContext[] = [];
  let gaugeCalls: CallContext[] = [];
  poolAddresses.forEach(poolAddress => { lpCalls.push({ reference: poolAddress, methodName: 'get_lp_token', methodParameters: [poolAddress] }); });
  poolAddresses.forEach(poolAddress => { gaugeCalls.push({ reference: poolAddress, methodName: 'get_gauges', methodParameters: [poolAddress] }); });
  
  // LP Token Balances:
  let lpMulticallResults = await multicallOneContractQuery(chain, cryptoRegistry, curve.registryABI, lpCalls);
  let lpTokens = Object.keys(lpMulticallResults).map(pool => lpMulticallResults[pool][0]) as Address[];
  balances.push(...(await getLPTokenBalances(lpTokens, wallet)));
  
  // Gauge Balances:
  let gaugeMulticallResults = await multicallOneContractQuery(chain, cryptoRegistry, curve.registryABI, gaugeCalls);
  let gauges = (Object.keys(gaugeMulticallResults).map(pool => gaugeMulticallResults[pool][0][0]) as Address[]).filter(gauge => gauge != zero);
  balances.push(...(await getGaugeBalances(gauges, wallet)));

  return balances;
}

// Function to get factory pool balances:
export const getFactoryPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolAddresses = await getPoolAddresses(factory);

  // Initializing Multicall:
  let gaugeCalls: CallContext[] = [];
  poolAddresses.forEach(poolAddress => { gaugeCalls.push({ reference: poolAddress, methodName: 'get_gauge', methodParameters: [poolAddress] }); });

  // LP Token Balances (same as pools):
  balances.push(...(await getLPTokenBalances(poolAddresses, wallet)));
  
  // Gauge Balances:
  let gaugeMulticallResults = await multicallOneContractQuery(chain, factory, curve.factoryABI, gaugeCalls);
  let gauges = (Object.keys(gaugeMulticallResults).map(pool => gaugeMulticallResults[pool][0]) as Address[]).filter(gauge => gauge != zero);
  balances.push(...(await getGaugeBalances(gauges, wallet)));

  return balances;
}

/* ========================================================================================================================================================================= */

// Function to get pool addresses:
const getPoolAddresses = async (registry: Address) => {
  let poolCount = parseInt(await query(chain, registry, curve.registryABI, 'pool_count', []));
  let poolIDs = [...Array(poolCount).keys()];
  let poolCalls: CallContext[] = [];
  poolIDs.forEach(poolID => {
    poolCalls.push({ reference: poolID.toString(), methodName: 'pool_list', methodParameters: [poolID] });
  });
  let poolMulticallResults = await multicallOneContractQuery(chain, registry, curve.registryABI, poolCalls);
  let poolAddresses = Object.keys(poolMulticallResults).map(poolID => poolMulticallResults[poolID][0]) as Address[];
  return poolAddresses;
}

// Function to get LP token balances:
const getLPTokenBalances = async (lpTokens: Address[], wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  if(lpTokens.length > 0) {
    let balanceMulticallResults = await multicallOneMethodQuery(chain, lpTokens, minABI, 'balanceOf', [wallet]);
    let promises = lpTokens.map(lpToken => (async () => {
      let balanceResults = balanceMulticallResults[lpToken];
      if(balanceResults) {
        let balance = parseBN(balanceResults[0]);
        if(balance > 0) {
          let newToken = await addCurveToken(chain, project, 'liquidity', lpToken, balance, wallet);
          balances.push(newToken);
        }
      }
    })());
    await Promise.all(promises);
  }
  return balances;
}

// Function get gauge balances:
const getGaugeBalances = async (gauges: Address[], wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  if(gauges.length > 0) {
    let balanceMulticallResults = await multicallOneMethodQuery(chain, gauges, minABI, 'balanceOf', [wallet]);
    let promises = gauges.map(gauge => (async () => {
      let balanceResults = balanceMulticallResults[gauge];
      if(balanceResults) {
        let balance = parseBN(balanceResults[0]);
        if(balance > 0) {
          let lpToken = await query(chain, gauge, curve.gaugeABI, 'lp_token', []);
          let newToken = await addCurveToken(chain, project, 'staked', lpToken, balance, wallet);
          balances.push(newToken);
  
          // Pending Rewards:
          for(let i = 0; i < 2; i++) {
            let token = await query(chain, gauge, curve.gaugeABI, 'reward_tokens', [i]);
            if(token != zero) {
              let rewards = parseInt(await query(chain, gauge, curve.gaugeABI, 'claimable_reward', [wallet, token]));
              if(rewards > 0) {
                let newToken = await addToken(chain, project, 'unclaimed', token, rewards, wallet);
                balances.push(newToken);
              }
            }
          }
        }
      }
    })());
    await Promise.all(promises);
  }
  return balances;
}