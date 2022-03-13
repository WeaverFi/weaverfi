
// Imports:
import { minABI, beethovenx } from '../../ABIs';
import { initResponse, query, addBalancerLikeToken, addToken } from '../../functions';
import type { Request } from 'express';
import { Chain, Address, Token, LPToken, isToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'beethovenx';
const beetsToken: Address = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e';
const poolIDs: Address[] = require('../../../static/beethovenx-pools.json').pools;
export const vault: Address = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';
export const masterChef: Address = '0x8166994d9ebBe5829EC86Bd81258149B87faCfd3';
export const fBeetAddress: Address = '0xfcef8a994209d6916EB2C86cDD2AFD60Aa6F54b1';
export const fBeetLogo = 'https://beets.fi/img/fBEETS.d7f7145f.png';

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getPoolBalances(wallet)));
      response.data.push(...(await getStakedBalances(wallet)));
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

// Function to get all pool balances:
const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let promises = poolIDs.map(id => (async () => {
    let address = (await query(chain, vault, beethovenx.vaultABI, 'getPool', [id]))[0];
    let balance = parseInt(await query(chain, address, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let newToken = await addBalancerLikeToken(chain, project, 'liquidity', address, balance, wallet, id, vault);
      if(isToken(newToken)) {
        newToken.logo = fBeetLogo;
      }
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all staked pool balances:
const getStakedBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let numRewardPools = parseInt(await query(chain, masterChef, beethovenx.masterChefABI, 'poolLength', []));
  let pendingBeets = 0;
  let promises: Promise<void>[] = [];
  for(let poolNum = 0; poolNum < numRewardPools; poolNum++) {
    promises.push((async () => {
      let balance = parseInt((await query(chain, masterChef, beethovenx.masterChefABI, 'userInfo', [poolNum, wallet])).amount);
      if(balance > 0) {
        let poolAddress: Address = await query(chain, masterChef, beethovenx.masterChefABI, 'lpTokens', [poolNum]);
        if(poolAddress !== fBeetAddress) {
          let poolId: Address = await query(chain, poolAddress, beethovenx.poolABI, 'getPoolId', []);
          let newToken = await addBalancerLikeToken(chain, project, 'staked', poolAddress, balance, wallet, poolId, vault);
          if(isToken(newToken)) {
            newToken.logo = fBeetLogo;
          }
          balances.push(newToken);
        }
      }
      let poolBeets = parseInt(await query(chain, masterChef, beethovenx.masterChefABI, 'pendingBeets', [poolNum, wallet]));
      if(poolBeets > 0) {
        pendingBeets += poolBeets;
      }
    })());
  }
  await Promise.all(promises);
  if(pendingBeets > 0) {
    let beets = await addToken(chain, project, 'unclaimed', beetsToken, pendingBeets, wallet);
    balances.push(beets);
  }
  return balances;
}