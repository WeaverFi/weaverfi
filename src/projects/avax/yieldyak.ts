
// Imports:
import axios from 'axios';
import { minABI, yieldyak } from '../../ABIs';
import { query, addToken, addLPToken, addAxialToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'yieldyak';
const staking: Address = '0x0cf605484A512d3F3435fed77AB5ddC0525Daf5f';
const yak: Address = '0x59414b3089ce2AF0010e7523Dea7E2b35d776ec7';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';
const lpSymbols: string[] = ['JLP', 'PGL', 'Lydia-LP', 'YSL', 'CRL', 'BGL', 'Olive-LP'];
const lpAxialSymbols: string[] = ['AS4D', 'AC4D', 'AM3D', 'AA3D'];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    let farms = Object.getOwnPropertyNames((await axios.get('https://staging-api.yieldyak.com/apys')).data);
    balance.push(...(await getFarmBalances(wallet, farms)));
    balance.push(...(await getStakedBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
const getFarmBalances = async (wallet: Address, farms: any) => {
  let balances: (Token | LPToken)[] = [];
  let promises = farms.map((farm: any) => (async () => {
    let balance = parseInt(await query(chain, farm, minABI, 'balanceOf', [wallet]));
    if(balance > 1) {
      let token = await query(chain, farm, yieldyak.farmABI, 'depositToken', []);
      let totalDeposits = parseInt(await query(chain, farm, yieldyak.farmABI, 'totalDeposits', []));
      let totalSupply = parseInt(await query(chain, farm, yieldyak.farmABI, 'totalSupply', []));
      let underlyingBalance = balance * (totalDeposits / totalSupply);
      if(token === '0x0000000000000000000000000000000000000000') {
        let newToken = await addToken(chain, project, 'staked', wavax, underlyingBalance, wallet);
        balances.push(newToken);
      } else {
        let symbol = await query(chain, token, minABI, 'symbol', []);

        // LP Farms:
        if(lpSymbols.includes(symbol)) {
          let newToken = await addLPToken(chain, project, 'staked', token, underlyingBalance, wallet);
          balances.push(newToken);

        // Axial Farms:
        } else if(lpAxialSymbols.includes(symbol)) {
          let newToken = await addAxialToken(chain, project, 'staked', token, underlyingBalance, wallet);
          balances.push(newToken);

        // Curve Farms:
        } else if(symbol === '3poolV2-f') {
          // Not supported yet.

        // Single-Asset Farms:
        } else {
          let newToken = await addToken(chain, project, 'staked', token, underlyingBalance, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get staked balances:
const getStakedBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let poolCount = parseInt(await query(chain, staking, yieldyak.stakingABI, 'poolLength', []));
  let pools = [...Array(poolCount).keys()];
  let wavaxRewards = 0;
  let promises = pools.map(poolID => (async () => {
    let balance = parseInt((await query(chain, staking, yieldyak.stakingABI, 'userInfo', [poolID, wallet])).amount);
    if(balance > 0) {
      let token = (await query(chain, staking, yieldyak.stakingABI, 'poolInfo', [poolID])).token;
      if(token.toLowerCase() != '0x6DBF865f19cd0AACA9550bdDD3b92f4f4E239468'.toLowerCase()) {
        if(token.toLowerCase() === yak.toLowerCase()) {
          let newToken = await addToken(chain, project, 'staked', yak, balance, wallet);
          balances.push(newToken);
        } else {
          let symbol = await query(chain, token, minABI, 'symbol', []);
          if(symbol === 'PGL') {
            let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
            balances.push(newToken);
          } else {
            let underlyingToken = await query(chain, token, yieldyak.intermediaryABI, 'depositToken', []);
            let actualBalance = (await query(chain, token, yieldyak.intermediaryABI, 'getDepositTokensForShares', [(balance / (10 ** 10)).toFixed(0)])) * (10 ** 10);
            let newToken = await addLPToken(chain, project, 'staked', underlyingToken, actualBalance, wallet);
            balances.push(newToken);
          }
        }

        // Pending WAVAX Rewards:
        let rewards = parseInt(await query(chain, staking, yieldyak.stakingABI, 'pendingRewards', [poolID, wallet]));
        if(rewards > 0) {
          wavaxRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(wavaxRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', wavax, wavaxRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}