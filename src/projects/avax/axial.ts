
// Imports:
import { WeaverError } from '../../error';
import { minABI, axial } from '../../ABIs';
import { addAxialToken } from '../../project-functions';
import { query, multicallOneContractQuery, multicallOneMethodQuery, addToken, addLPToken, addXToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, XToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'axial';
const masterChef: Address = '0x958C0d0baA8F220846d3966742D4Fb5edc5493D3';
const gaugeProxy: Address = '0x3d09A80369071E6AC91634e0Bf889EE54Dd510C6';
const sAXIAL: Address = '0xed7f93C8FD3B96B53c924F601B3948175D2820D8';
const veAXIAL: Address = '0x3f563F7efc6dC55adFc1B64BC6Bd4bC5F394c4b2';
const axialToken: Address = '0xcF8419A615c57511807236751c0AF38Db4ba3351';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  balance.push(...(await getPoolBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalances()', err) })));
  balance.push(...(await getPoolBalancesV2(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalancesV2()', err) })));
  balance.push(...(await getStakedAXIAL(wallet).catch((err) => { throw new WeaverError(chain, project, 'getStakedAXIAL()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, masterChef, axial.masterChefABI, 'poolLength', []));
  let pools = [...Array(poolCount).keys()];

  // User Info Multicall Query:
  let calls: CallContext[] = [];
  pools.forEach(poolID => {
    calls.push({ reference: poolID.toString(), methodName: 'userInfo', methodParameters: [poolID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChef, axial.masterChefABI, calls);
  let promises = pools.map(poolID => (async () => {
    let userInfoResults = multicallResults[poolID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChef, axial.masterChefABI, 'poolInfo', [poolID])).lpToken;
        let symbol = await query(chain, token, minABI, 'symbol', []);
  
        // Standard LPs:
        if(symbol === 'JLP' || symbol === 'PGL') {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          newToken.info = { deprecated: true };
          balances.push(newToken);
  
        // Axial LPs:
        } else {
          let newToken = await addAxialToken(chain, project, 'staked', token, balance, wallet);
          newToken.info = { deprecated: true };
          balances.push(newToken);
        }
  
        // Pending Rewards:
        let rewards = await query(chain, masterChef, axial.masterChefABI, 'pendingTokens', [poolID, wallet]);
        if(rewards.pendingAxial > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', axialToken, rewards.pendingAxial, wallet);
          balances.push(newToken);
        }
        if(rewards.pendingBonusToken > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, rewards.pendingBonusToken, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all pool V2 balances:
export const getPoolBalancesV2 = async (wallet: Address) => {
  let balances: Token[] = [];
  let tokens: Address[] = await query(chain, gaugeProxy, axial.gaugeProxyABI, 'tokens', []);

  // Gauge Multicall Query:
  let gaugeCalls: CallContext[] = [];
  tokens.forEach(token => {
    gaugeCalls.push({ reference: token, methodName: 'getGauge', methodParameters: [token] });
  });
  let gaugeMulticallResults = await multicallOneContractQuery(chain, gaugeProxy, axial.gaugeProxyABI, gaugeCalls);

  // Balance Multicall Query:
  let gaugeAddresses: Address[] = Object.keys(gaugeMulticallResults).map(token => gaugeMulticallResults[token][0]);
  let balanceMulticallResults = await multicallOneMethodQuery(chain, gaugeAddresses, minABI, 'balanceOf', [wallet]);
  let promises = Object.keys(gaugeMulticallResults).map(token => (async () => {
    let gauge: Address = gaugeMulticallResults[token][0];
    if(balanceMulticallResults[gauge]) {
      let balance = parseBN(balanceMulticallResults[gauge][0]);
      if(balance > 0) {
        let newToken = await addAxialToken(chain, project, 'staked', token as Address, balance, wallet, gauge);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked AXIAL balances:
export const getStakedAXIAL = async (wallet: Address) => {
  let balances: XToken[] = [];

  // sAXIAL Balance:
  let sAxialBalance = parseInt(await query(chain, sAXIAL, axial.sAxialABI, 'getBalance', [wallet]));
  if(sAxialBalance > 0) {
    let sAxialLock = await query(chain, sAXIAL, axial.sAxialABI, 'getLock', [wallet]);
    let axialAmount = parseBN(sAxialLock.startingAmountLocked);
    let unlock = parseBN(sAxialLock.endBlockTime);
    let newToken = await addXToken(chain, project, 'staked', sAXIAL, sAxialBalance, wallet, axialToken, axialAmount, sAXIAL);
    newToken.info = { unlock };
    balances.push(newToken);
  }

  // veAXIAL Balance:
  let veAxialBalance = parseInt(await query(chain, veAXIAL, axial.veAxialABI, 'getAccrued', [wallet]));
  if(veAxialBalance > 0) {
    let axialAmount = parseInt(await query(chain, veAXIAL, axial.veAxialABI, 'getStaked', [wallet]));
    let newToken = await addXToken(chain, project, 'staked', veAXIAL, veAxialBalance, wallet, axialToken, axialAmount, veAXIAL);
    balances.push(newToken);
  }
  return balances;
}