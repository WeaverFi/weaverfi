
// Imports:
import { minABI } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addToken } from '../../functions';

// Type Imports:
import type { Chain, Address, Token } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'pooltogether';
const poolTicketV4: Address = '0x6a304dFdb9f808741244b6bfEe65ca7B3b3A6076';
const poolDepositV4: Address = '0x19DE635fb3678D8B8154E37d8C9Cdf182Fe84E60';
const usdc: Address = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
const poolToken: Address = '0x25788a1a171ec66da6502f9975a15b609ff54cf6';
const communityPool: Address = '0xd80EAA761CcfdC8698999D73C96CeC39fBB1fC48';
const communityPoolPrizeContract: Address = '0x2aC049f07d56Ed04F84Ff80022A71a1A2d8cE19b';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getPoolBalanceV4(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalanceV4()', err) })));
  balance.push(...(await getCommunityPoolBalance(wallet).catch((err) => { throw new WeaverError(chain, project, 'getCommunityPoolBalance()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get V4 pool balance:
export const getPoolBalanceV4 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolTicketV4, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet, poolDepositV4);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get community pool balances:
export const getCommunityPoolBalance = async (wallet: Address) => {
  let balance = parseInt(await query(chain, communityPool, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', poolToken, balance, wallet, communityPoolPrizeContract);
    return [newToken];
  } else {
    return [];
  }
}