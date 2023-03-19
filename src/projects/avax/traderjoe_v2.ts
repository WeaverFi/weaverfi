
// Imports:
import { traderjoe } from '../../ABIs';
import { WeaverError } from '../../error';
import { addTraderJoeToken } from '../../project-functions';
import { query, multicallOneContractQuery, addToken, addLPToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, DebtToken, XToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'traderjoe_v2';
const masterChef: Address = '0xd6a4F121CA35509aF06A0Be99093d08462f53052';
const joe: Address = '0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd';
const xjoe: Address = '0x57319d41F71E81F3c65F2a47CA4e001EbAFd4F33';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken | DebtToken | XToken)[] = [];
  balance.push(...(await getFarmBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getFarmBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get farm balances:
export const getFarmBalances = async (wallet: Address) => {
  let balances: (Token | LPToken | XToken)[] = [];
  let farmCount = parseInt(await query(chain, masterChef, traderjoe.masterChefABI, 'poolLength', []));
  let farms = [...Array(farmCount).keys()];

  // User Info Multicall Query:
  let calls: CallContext[] = [];
  farms.forEach(farmID => {
    calls.push({ reference: farmID.toString(), methodName: 'userInfo', methodParameters: [farmID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChef, traderjoe.masterChefABI, calls);
  let promises = farms.map(farmID => (async () => {
    let userInfoResults = multicallResults[farmID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let token = (await query(chain, masterChef, traderjoe.masterChefABI, 'poolInfo', [farmID])).lpToken;

        // xJOE Farm:
        if(token === xjoe) {
          let newToken = await addTraderJoeToken(chain, project, 'staked', balance, wallet, masterChef);
          balances.push(newToken);
  
        // LP Farms:
        } else {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet, masterChef);
          balances.push(newToken);
        }
  
        // JOE Rewards:
        let rewards = await query(chain, masterChef, traderjoe.masterChefABI, 'pendingTokens', [farmID, wallet]);
        let pendingJoe = parseInt(rewards.pendingJoe);
        if(pendingJoe > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', joe, pendingJoe, wallet, masterChef);
          balances.push(newToken);
        }
  
        // Bonus Rewards:
        let pendingBonus = parseInt(rewards.pendingBonusToken);
        if(pendingBonus > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', rewards.bonusTokenAddress, pendingBonus, wallet, masterChef);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}