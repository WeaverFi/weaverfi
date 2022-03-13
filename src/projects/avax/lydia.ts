
// Imports:
import { minABI, lydia } from '../../ABIs';
import { initResponse, query, addToken, addLPToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'avax';
const project = 'lydia';
const registry: Address = '0xFb26525B14048B7BB1F3794F6129176195Db7766';
const autoLydFarm: Address = '0xA456bB3a9905D56A9b40D6361EDA931ed52d5bED';
const lyd: Address = '0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084';
const maximusFarms: Address[] = [
  '0x036fa505E4D6358a772f578B4031c9AF1af5Bd1D',
  '0x7d0Cc15C9d3740E18a27064b8EFfE5EbAA7944e7',
  '0xdF5C8D10685cbdEA26fed99A3BB1142987345013',
  '0x07F9B7b1FeD6a71AF80AC85d1691A4EC0EBE370b',
  '0xad9aC72aAE3dB711CDcC9FD1142bE46742102354',
  '0x15eCF52152C15029557c89CD9CF9Cf148366BFDC',
  '0xeB3dDd62CF53199593811dae4653321Ce26Ec537'
];

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
      response.data.push(...(await getAutoLYDFarmBalance(wallet)));
      response.data.push(...(await getMaximusFarmBalances(wallet)));
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
  let farmCount = parseInt(await query(chain, registry, lydia.registryABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];
  let promises = farms.map(farmID => (async () => {
    let balance = parseInt((await query(chain, registry, lydia.registryABI, 'userInfo', [farmID, wallet])).amount);
    if(balance > 0) {
      let poolInfo = await query(chain, registry, lydia.registryABI, 'poolInfo', [farmID]);
      if(poolInfo.lpToken.toLowerCase() === lyd.toLowerCase()) {
        let newToken = await addToken(chain, project, 'staked', poolInfo.lpToken, balance, wallet);
        balances.push(newToken);
      } else {
        let newToken = await addLPToken(chain, project, 'staked', poolInfo.lpToken, balance, wallet);
        balances.push(newToken);
      }
      let rewards = await (query(chain, registry, lydia.registryABI, 'pendingLyd', [farmID, wallet]));
      if(rewards > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', lyd, rewards, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get Auto LYD farm balance:
const getAutoLYDFarmBalance = async (wallet: Address) => {
  let shares = parseInt(await query(chain, autoLydFarm, lydia.lydFarmABI, 'sharesOf', [wallet]));
  if(shares > 0) {
    let exchangeRate = parseInt(await query(chain, autoLydFarm, lydia.lydFarmABI, 'getPricePerFullShare', [])) / (10 ** 18);
    let balance = shares * exchangeRate;
    let newToken = await addToken(chain, project, 'staked', lyd, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get Maximus farm balances:
const getMaximusFarmBalances = async (wallet: Address): Promise<(Token | LPToken)[]> => {
  let balances: (Token | LPToken)[] = [];
  let promises = maximusFarms.map(farm => (async () => {
    let balance = parseInt(await query(chain, farm, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let lpToken = await query(chain, farm, lydia.maximusFarmABI, 'stakingToken', []);
      let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
      balances.push(newToken);
      let rewards = parseInt(await query(chain, farm, lydia.maximusFarmABI, 'earned', [wallet]));
      if(rewards > 0) {
        let newToken = await addToken(chain, project, 'unclaimed', lyd, rewards, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}