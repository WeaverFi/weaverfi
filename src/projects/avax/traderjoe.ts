
// Imports:
import { minABI, traderjoe } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addDebtToken, addTraderJoeToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken, DebtToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'avax';
const project = 'traderjoe';
const masterChefV2: Address = '0xd6a4F121CA35509aF06A0Be99093d08462f53052';
const masterChefV3: Address = '0x188bED1968b795d5c9022F6a0bb5931Ac4c18F00';
const bankController: Address = '0xdc13687554205E5b89Ac783db14bb5bba4A1eDaC';
const joe: Address = '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd';
const xjoe: Address = '0x57319d41F71E81F3c65F2a47CA4e001EbAFd4F33';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getStakedJOE(wallet)));
      response.data.push(...(await getFarmBalances(wallet)));
      response.data.push(...(await getMarketBalances(wallet)));
    } catch(err: any) {
      console.error(err);
      response.status = 'error';
      response.data = [{error: 'Internal API Error'}];
    }
  }

  // Returning Response:
  return JSON.stringify(response, null, ' ');
}

/* ========================================================================================================================================================================= */

// Function to get staked JOE balance:
const getStakedJOE = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xjoe, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addTraderJoeToken(chain, project, 'staked', xjoe, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get farm balances:
const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let farmCountV2 = parseInt(await query(chain, masterChefV2, traderjoe.masterChefABI, 'poolLength', []));
  let farmCountV3 = parseInt(await query(chain, masterChefV3, traderjoe.masterChefABI, 'poolLength', []));
  let farmsV2 = [...Array(farmCountV2).keys()];
  let farmsV3 = [...Array(farmCountV3).keys()];
  let joeRewards = 0;

  // Farms V2:
  let promisesV2 = farmsV2.map(farmID => (async () => {
    let balance = parseInt((await query(chain, masterChefV2, traderjoe.masterChefABI, 'userInfo', [farmID, wallet])).amount);
    if(balance > 0) {
      let token = (await query(chain, masterChefV2, traderjoe.masterChefABI, 'poolInfo', [farmID])).lpToken;
      if(token === xjoe) {
        let newToken = await addTraderJoeToken(chain, project, 'staked', xjoe, balance, wallet);
        balances.push(newToken);
      } else {
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }
      let rewards = await query(chain, masterChefV2, traderjoe.masterChefABI, 'pendingTokens', [farmID, wallet]);
      let pendingJoe = parseInt(rewards.pendingJoe);
      if(pendingJoe > 0) {
        joeRewards += pendingJoe;
      }
      let pendingBonus = parseInt(rewards.pendingBonusToken);
      if(pendingBonus > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promisesV2);

  // Farms V3:
  let promisesV3 = farmsV3.map(farmID => (async () => {
    let balance = parseInt((await query(chain, masterChefV3, traderjoe.masterChefABI, 'userInfo', [farmID, wallet])).amount);
    if(balance > 0) {
      let token = (await query(chain, masterChefV3, traderjoe.masterChefABI, 'poolInfo', [farmID])).lpToken;
      if(token === xjoe) {
        let newToken = await addTraderJoeToken(chain, project, 'staked', xjoe, balance, wallet);
        balances.push(newToken);
      } else {
        let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
        balances.push(newToken);
      }
      let rewards = await query(chain, masterChefV3, traderjoe.masterChefABI, 'pendingTokens', [farmID, wallet]);
      let pendingJoe = parseInt(rewards.pendingJoe);
      if(pendingJoe > 0) {
        joeRewards += pendingJoe;
      }
      let pendingBonus = parseInt(rewards.pendingBonusToken);
      if(pendingBonus > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promisesV3);
  if(joeRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', joe, joeRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get market balance:
const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets = await query(chain, bankController, traderjoe.bankControllerABI, 'getAllMarkets', []);
  let promises = markets.map((market: any) => (async () => {
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    let account = await query(chain, market, traderjoe.marketABI, 'getAccountSnapshot', [wallet]);
    let debt = parseInt(account[2]);
    let exchangeRate = parseInt(account[3]);
    if(balance > 0) {
      let token = await query(chain, market, traderjoe.marketABI, 'underlying', []);
      let underlyingBalance = balance * (exchangeRate / (10 ** 18));
      let newToken = await addToken(chain, project, 'lent', token, underlyingBalance, wallet);
      balances.push(newToken);
    }
    if(debt > 0) {
      let token = await query(chain, market, traderjoe.marketABI, 'underlying', []);
      let newToken = await addDebtToken(chain, project, token, debt, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}