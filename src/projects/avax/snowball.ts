
// Imports:
import axios from 'axios';
import { WeaverError } from '../../error';
import { minABI, snowball } from '../../ABIs';
import { addAxialToken } from '../../project-functions';
import { query, multicallOneMethodQuery, addToken, addLPToken, addXToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, URL, Token, LPToken, XToken, SnowballAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'snowball';
const snob: Address = '0xC38f41A296A4493Ff429F1238e030924A1542e50';
const xsnob: Address = '0x83952E7ab4aca74ca96217D6F8f7591BEaD6D64E';
const apiURL: URL = 'https://api.snowapi.net/graphql';
const apiQuery = { query: '{ LastSnowballInfo { poolsInfo { symbol address lpAddress deprecated yearlyAPY yearlySwapFees gaugeInfo { address snobYearlyAPR } } } }' };

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  let farms: SnowballAPIResponse[] = (await axios.post(apiURL, apiQuery)).data.data.LastSnowballInfo.poolsInfo;
  if(farms.length > 0) {
    balance.push(...(await getFarmBalances(farms, wallet).catch((err) => { throw new WeaverError(chain, project, 'getFarmBalances()', err) })));
    balance.push(...(await getStakedSNOB(wallet).catch((err) => { throw new WeaverError(chain, project, 'getStakedSNOB()', err) })));
  } else {
    throw new WeaverError(chain, project, 'Invalid response from Snowball API');
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (farms: SnowballAPIResponse[], wallet: Address) => {
  let balances: (Token | LPToken)[] = [];

  // Balance Multicall Query:
  let farmGaugeAddresses = farms.map(farm => farm.gaugeInfo.address);
  let multicallResults = await multicallOneMethodQuery(chain, farmGaugeAddresses, minABI, 'balanceOf', [wallet]);
  let promises = farms.map(farm => (async () => {
    let balanceResults = multicallResults[farm.gaugeInfo.address];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        let newToken: Token | LPToken;
        let exchangeRatio = parseInt(await query(chain, farm.address, snowball.farmABI, 'getRatio', [])) / (10 ** 18);
  
        // Standard Liquidity Pools:
        if(farm.symbol === 'PGL' || farm.symbol === 'JLP') {
          newToken = await addLPToken(chain, project, 'staked', farm.lpAddress, balance * exchangeRatio, wallet, farm.address);
  
        // Axial Pools:
        } else if(farm.symbol === 'AXLP') {
          if(farm.lpAddress.toLowerCase() === '0x5305a6c4da88391f4a9045bf2ed57f4bf0cf4f62') { // AVAX-AXIAL Pool
            newToken = await addLPToken(chain, project, 'staked', farm.lpAddress, balance * exchangeRatio, wallet, farm.address);
          } else {
            newToken = await addAxialToken(chain, project, 'staked', farm.lpAddress, balance * exchangeRatio, wallet, farm.address);
          }
  
        // Other Single-Asset Pools:
        } else {
          newToken = await addToken(chain, project, 'staked', farm.lpAddress, balance * exchangeRatio, wallet, farm.address);
        }
  
        // Adding Extra Token Info:
        newToken.info = {
          apy: farm.yearlySwapFees + farm.yearlyAPY + farm.gaugeInfo.snobYearlyAPR,
          deprecated: farm.deprecated
        }
        balances.push(newToken);
  
        // Pending SNOB Rewards:
        let rewards = parseInt(await query(chain, farm.gaugeInfo.address, snowball.gaugeABI, 'earned', [wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', snob, rewards, wallet, farm.gaugeInfo.address);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked SNOB balance:
export const getStakedSNOB = async (wallet: Address) => {
  let balance = parseInt(await query(chain, xsnob, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let locked = await query(chain, xsnob, snowball.stakingABI, 'locked', [wallet]);
    let newToken = await addXToken(chain, project, 'staked', xsnob, balance, wallet, snob, parseInt(locked.amount), xsnob);
    newToken.info = {
      unlock: parseInt(locked.end)
    }
    return [newToken];
  } else {
    return [];
  }
}