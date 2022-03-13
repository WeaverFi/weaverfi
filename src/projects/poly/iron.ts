
// Imports:
import { minABI, iron } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, addDebtToken, addIronToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken, DebtToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'poly';
const project = 'iron';
const registry: Address = '0x1fD1259Fa8CdC60c6E8C86cfA592CA1b8403DFaD';
const lending: Address = '0xF20fcd005AFDd3AD48C85d0222210fe168DDd10c';
const staking: Address = '0xB1Bf26c7B43D2485Fa07694583d2F17Df0DDe010';
const ice: Address = '0x4A81f8796e0c6Ad4877A51C86693B0dE8093F2ef';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getFarmBalances(wallet)));
      response.data.push(...(await getMarketBalances(wallet)));
      response.data.push(...(await getMarketRewards(wallet)));
      response.data.push(...(await getStakedICE(wallet)));
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

// Function to get all farm balances:
const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, registry, iron.registryABI, 'poolLength', []));
  let farms = [...Array(poolCount).keys()];
  let promises = farms.map(farmID => (async () => {
    let balance = parseInt((await query(chain, registry, iron.registryABI, 'userInfo', [farmID, wallet])).amount);
    if(balance > 0) {
      let lpToken = await query(chain, registry, iron.registryABI, 'lpToken', [farmID]);

      // Iron LP Tokens:
      if(farmID === 0 || farmID === 3) {
        let newToken = await addIronToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);

      // Other LP Tokens:
      } else {
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
      }

      // Pending ICE Rewards:
      let rewards = parseInt(await query(chain, registry, iron.registryABI, 'pendingReward', [farmID, wallet]));
      if(rewards > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', ice, rewards, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all market balances and debt:
const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: any[] = await query(chain, lending, iron.lendingABI, 'getAllMarkets', []);
  let promises = markets.map(market => (async () => {
    let balance = parseInt(await query(chain, market, minABI, 'balanceOf', [wallet]));
    let account = await query(chain, market, iron.marketABI, 'getAccountSnapshot', [wallet]);
    let debt = parseInt(account[2]);
    let exchangeRate = parseInt(account[3]);

    // Lending Balances:
    if(balance > 0) {
      let tokenAddress: Address;
      if(market.toLowerCase() === '0xCa0F37f73174a28a64552D426590d3eD601ecCa1'.toLowerCase()) {
        tokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      } else {
        tokenAddress = await query(chain, market, iron.marketABI, 'underlying', []);
      }
      let underlyingBalance = balance * (exchangeRate / (10 ** 18));
      let newToken = await addToken(chain, project, 'lent', tokenAddress, underlyingBalance, wallet);
      balances.push(newToken);
    }

    // Borrowing Balances:
    if(debt > 0) {
      let tokenAddress: Address;
      if(market.toLowerCase() === '0xCa0F37f73174a28a64552D426590d3eD601ecCa1'.toLowerCase()) {
        tokenAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
      } else {
        tokenAddress = await query(chain, market, iron.marketABI, 'underlying', []);
      }
      let newToken = await addDebtToken(chain, project, tokenAddress, debt, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all market rewards:
const getMarketRewards = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, lending, iron.lendingABI, 'rewardAccrued', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', ice, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked ICE balance:
const getStakedICE = async (wallet: Address) => {
  let balance = parseInt((await query(chain, staking, iron.stakingABI, 'locked', [wallet])).amount);
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', ice, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}