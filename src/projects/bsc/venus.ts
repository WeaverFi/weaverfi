
// Imports:
import { minABI, venus } from '../../ABIs';
import { query, multicallQuery, addToken, addDebtToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'venus';
const controller: Address = '0xfD36E2c2a6789Db23113685031d7F16329158384';
const vault: Address = '0x0667eed0a0aab930af74a3dfedd263a73994f216';
const xvsVault: Address = '0x051100480289e704d20e9DB4804837068f3f9204';
const vai: Address = '0x4BD17003473389A42DAF6a0a729f6Fdb328BbBd7';
const xvs: Address = '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | DebtToken)[] = [];
  try {
    balance.push(...(await getMarketBalances(wallet)));
    balance.push(...(await getPendingRewards(wallet)));
    balance.push(...(await getStakedVAI(wallet)));
    balance.push(...(await getStakedXVS(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get market balances:
export const getMarketBalances = async (wallet: Address) => {
  let balances: (Token | DebtToken)[] = [];
  let markets: Address[] = await query(chain, controller, venus.controllerABI, 'getAllMarkets', []);
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  markets.forEach(market => {
    queries.push({
      reference: market,
      contractAddress: market,
      abi: minABI.concat(venus.marketABI),
      calls: [
        { reference: 'marketBalance', methodName: 'balanceOf', methodParameters: [wallet] },
        { reference: 'borrowBalance', methodName: 'borrowBalanceStored', methodParameters: [wallet] }
      ]
    });
  });

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = markets.map(market => (async () => {
    let marketBalanceResults = multicallResults[market].callsReturnContext.find(i => i.reference === 'marketBalance');
    let borrowBalanceResults = multicallResults[market].callsReturnContext.find(i => i.reference === 'borrowBalance');

    // Lending Balances:
    if(marketBalanceResults && marketBalanceResults.success) {
      let balance = parseBN(marketBalanceResults.returnValues[0]);
      if(balance > 0) {
        let exchangeRate = parseInt(await query(chain, market, venus.marketABI, 'exchangeRateStored', []));
        let decimals = parseInt(await query(chain, market, minABI, 'decimals', []));
        let underlyingToken: Address;
        if(market.toLowerCase() === '0xa07c5b74c9b40447a954e1466938b865b6bbea36') {
          underlyingToken = defaultAddress;
        } else {
          underlyingToken = await query(chain, market, venus.marketABI, 'underlying', []);
        }
        let underlyingBalance = (balance / (10 ** decimals)) * (exchangeRate / (10 ** (decimals + 2)));
        let newToken = await addToken(chain, project, 'lent', underlyingToken, underlyingBalance, wallet);
        balances.push(newToken);
      }
    }

    // Borrowing Balances:
    if(borrowBalanceResults && borrowBalanceResults.success) {
      let debt = parseBN(borrowBalanceResults.returnValues[0]);
      if(debt > 0) {
        let underlyingToken: Address;
        if(market.toLowerCase() === '0xa07c5b74c9b40447a954e1466938b865b6bbea36') {
          underlyingToken = defaultAddress;
        } else {
          underlyingToken = await query(chain, market, venus.marketABI, 'underlying', []);
        }
        let newToken = await addDebtToken(chain, project, underlyingToken, debt, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get pending XVS rewards:
export const getPendingRewards = async (wallet: Address) => {
  let rewards = parseInt(await query(chain, controller, venus.controllerABI, 'venusAccrued', [wallet]));
  if(rewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', xvs, rewards, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked VAI balance:
export const getStakedVAI = async (wallet: Address) => {
  let balances: Token[] = [];
  let balance = parseInt((await query(chain, vault, venus.vaultABI, 'userInfo', [wallet])).amount);
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', vai, balance, wallet);
    balances.push(newToken);
  }
  let pendingRewards = parseInt(await query(chain, vault, venus.vaultABI, 'pendingXVS', [wallet]));
  if(pendingRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', xvs, pendingRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get staked XVS balance:
export const getStakedXVS = async (wallet: Address) => {
  let xvsBalance = 0;
  let balance = parseInt(await query(chain, xvsVault, venus.xvsVaultABI, 'getUserInfo', [xvs, 0, wallet]));
  if(balance > 0) {
    xvsBalance += balance;
    let pendingRewards = parseInt(await query(chain, xvsVault, venus.xvsVaultABI, 'pendingReward', [xvs, 0, wallet]));
    if(pendingRewards > 0) {
      xvsBalance += pendingRewards;
    }
    let newToken = await addToken(chain, project, 'staked', xvs, xvsBalance, wallet);
    return [newToken];
  } else {
    return [];
  }
}