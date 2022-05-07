
// Imports:
import axios from 'axios';
import { minABI, yieldyak } from '../../ABIs';
import { query, multicallOneMethodQuery, addToken, addLPToken, addAxialToken, parseBN } from '../../functions';
import type { Chain, Address, URL, Token, LPToken, YieldYakAPIResponse } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'yieldyak';
const staking: Address = '0x0cf605484A512d3F3435fed77AB5ddC0525Daf5f';
const yak: Address = '0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
const lpSymbols: string[] = ['JLP', 'PGL', 'Lydia-LP', 'YSL', 'CRL', 'BGL', 'Olive-LP'];
const lpAxialSymbols: string[] = ['AS4D', 'AC4D', 'AM3D', 'AA3D'];
const zero: Address = '0x0000000000000000000000000000000000000000';
const apiURL: URL = 'https://staging-api.yieldyak.com/apys';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    let farms: Record<Address, YieldYakAPIResponse> = (await axios.get(apiURL)).data;
    balance.push(...(await getFarmBalances(wallet, farms)));
    balance.push(...(await getStakedYAK(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address, farms: Record<Address, YieldYakAPIResponse>) => {
  let balances: (Token | LPToken)[] = [];
  
  // Balance Multicall Query:
  let farmAddresses = Object.keys(farms) as Address[];
  let multicallResults = await multicallOneMethodQuery(chain, farmAddresses, minABI, 'balanceOf', [wallet]);
  let promises = farmAddresses.map(farm => (async () => {
    let balanceResults = multicallResults[farm];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 1) {
        let token = await query(chain, farm, yieldyak.farmABI, 'depositToken', []);
        let totalDeposits = parseInt(await query(chain, farm, yieldyak.farmABI, 'totalDeposits', []));
        let totalSupply = parseInt(await query(chain, farm, minABI, 'totalSupply', []));
        let underlyingBalance = balance * (totalDeposits / totalSupply);
  
        // AVAX Farm:
        if(token === zero) {
          let newToken = await addToken(chain, project, 'staked', wavax, underlyingBalance, wallet);
          let farmAPY = farms[farm].apy;
          if(farmAPY) {
            newToken.info = {
              apy: farmAPY
            }
          }
          balances.push(newToken);
  
        // Other Farms:
        } else {
          let symbol = await query(chain, token, minABI, 'symbol', []);
  
          // LP Farms:
          if(lpSymbols.includes(symbol)) {
            let newToken = await addLPToken(chain, project, 'staked', token, underlyingBalance, wallet);
            let farmAPY = farms[farm].apy;
            if(farmAPY) {
              newToken.info = {
                apy: farmAPY
              }
            }
            balances.push(newToken);
  
          // Axial Farms:
          } else if(lpAxialSymbols.includes(symbol)) {
            let newToken = await addAxialToken(chain, project, 'staked', token, underlyingBalance, wallet);
            let farmAPY = farms[farm].apy;
            if(farmAPY) {
              newToken.info = {
                apy: farmAPY
              }
            }
            balances.push(newToken);
  
          // Curve Farms:
          } else if(symbol === '3poolV2-f') {
            // Not supported yet.
  
          // Single-Asset Farms:
          } else {
            let newToken = await addToken(chain, project, 'staked', token, underlyingBalance, wallet);
            let farmAPY = farms[farm].apy;
            if(farmAPY) {
              newToken.info = {
                apy: farmAPY
              }
            }
            balances.push(newToken);
          }
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked YAK:
export const getStakedYAK = async (wallet: Address) => {
  let balance = parseInt((await query(chain, staking, yieldyak.stakingABI, 'userInfo', [0, wallet])).amount);
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', yak, balance, wallet);
    return [newToken];
  } else {
    return [];
  }
}