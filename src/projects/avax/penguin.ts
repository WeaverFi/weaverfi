
// Imports:
import { minABI, penguin } from '../../ABIs';
import { query, addToken, addLPToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'penguin';
const iglooMaster: Address = '0x256040dc7b3CECF73a759634fc68aA60EA0D68CB';
const nest: Address = '0xE9476e16FE488B90ada9Ab5C7c2ADa81014Ba9Ee';
const clubPenguin: Address = '0x86e8935a8F20231dB4b44A2ac3848Fbf44d22ec8';
const pefi: Address = '0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getIglooBalances(wallet)));
    balance.push(...(await getStakedPEFI(wallet)));
    balance.push(...(await getClubPenguinBalance(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get Igloo balances:
const getIglooBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let iglooCount = parseInt(await query(chain, iglooMaster, penguin.masterABI, 'poolLength', []));
  let igloos = [...Array(iglooCount).keys()];
  let pefiRewards = 0;
  let promises = igloos.map(iglooID => (async () => {
    let balance = parseInt((await query(chain, iglooMaster, penguin.masterABI, 'userInfo', [iglooID, wallet])).amount);
    if(balance > 0) {
      let token = (await query(chain, iglooMaster, penguin.masterABI, 'poolInfo', [iglooID])).poolToken;
      let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
      balances.push(newToken);
      let pendingPEFI = parseInt(await query(chain, iglooMaster, penguin.masterABI, 'totalPendingPEFI', [iglooID, wallet]));
      if(pendingPEFI > 0) {
        pefiRewards += pendingPEFI;
      }
      let pendingBonus = await query(chain, iglooMaster, penguin.masterABI, 'pendingTokens', [iglooID, wallet]);
      if(pendingBonus[0].length > 2) {
        if(parseInt(pendingBonus[1][2]) > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', pendingBonus[0][2], parseInt(pendingBonus[1][2]), wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  if(pefiRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', pefi, pefiRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get staked PEFI balance:
const getStakedPEFI = async (wallet: Address) => {
  let balance = parseInt(await query(chain, nest, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = parseInt(await query(chain, nest, penguin.nestABI, 'currentExchangeRate', [])) / (10 ** 18);
    let newToken = await addToken(chain, project, 'staked', pefi, balance * exchangeRate, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get Club Penguin balance:
const getClubPenguinBalance = async (wallet: Address) => {
  let balance = parseInt(await query(chain, clubPenguin, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = parseInt(await query(chain, nest, penguin.nestABI, 'currentExchangeRate', [])) / (10 ** 18);
    let newToken = await addToken(chain, project, 'staked', pefi, balance * exchangeRate, wallet);
    return [newToken];
  } else {
    return [];
  }
}