
// Imports:
import { WeaverError } from '../../error';
import { minABI, penguin } from '../../ABIs';
import { query, multicallOneContractQuery, addToken, addLPToken, addXToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, XToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'penguin';
const iglooMaster: Address = '0x256040dc7b3CECF73a759634fc68aA60EA0D68CB';
const clubPenguin: Address = '0x86e8935a8F20231dB4b44A2ac3848Fbf44d22ec8';
const pefi: Address = '0xe896CDeaAC9615145c0cA09C8Cd5C25bced6384c';
const ipefi: Address = '0xE9476e16FE488B90ada9Ab5C7c2ADa81014Ba9Ee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | XToken)[] = [];
  balance.push(...(await getIglooBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getIglooBalances()', err) })));
  balance.push(...(await getStakedPEFI(wallet).catch((err) => { throw new WeaverError(chain, project, 'getStakedPEFI()', err) })));
  balance.push(...(await getClubPenguinBalance(wallet).catch((err) => { throw new WeaverError(chain, project, 'getClubPenguinBalance()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get Igloo balances:
export const getIglooBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let iglooCount = parseInt(await query(chain, iglooMaster, penguin.masterABI, 'poolLength', []));
  let igloos = [...Array(iglooCount).keys()];
  let pefiRewards = 0;
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  igloos.forEach(iglooID => {
    calls.push({ reference: iglooID.toString(), methodName: 'userInfo', methodParameters: [iglooID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, iglooMaster, penguin.masterABI, calls);
  let promises = igloos.map(iglooID => (async () => {
    let userInfoResults = multicallResults[iglooID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
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
    }
  })());
  await Promise.all(promises);
  if(pefiRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', pefi, pefiRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get iPEFI balance:
export const getStakedPEFI = async (wallet: Address) => {
  let balance = parseInt(await query(chain, ipefi, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = parseInt(await query(chain, ipefi, penguin.nestABI, 'currentExchangeRate', [])) / (10 ** 18);
    let newToken = await addXToken(chain, project, 'staked', ipefi, balance, wallet, pefi, balance * exchangeRate);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get Club Penguin balance:
export const getClubPenguinBalance = async (wallet: Address) => {
  let balance = parseInt(await query(chain, clubPenguin, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let exchangeRate = parseInt(await query(chain, ipefi, penguin.nestABI, 'currentExchangeRate', [])) / (10 ** 18);
    let newToken = await addXToken(chain, project, 'staked', ipefi, balance, wallet, pefi, balance * exchangeRate);
    return [newToken];
  } else {
    return [];
  }
}