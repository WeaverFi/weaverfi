
// Imports:
import { minABI, yearn } from '../../ABIs';
import { query, multicallQuery, addToken, addCurveToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'eth';
const project = 'yearn';
const deployer: Address = '0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804';
const yTokenList: Address[] = [
  '0x16de59092dAE5CcF4A1E6439D611fd0653f0Bd01', // yDAI v2
  '0xC2cB1040220768554cf699b0d863A3cd4324ce32', // yDAI v3
  '0xd6aD7a6750A7593E092a9B218d66C0A814a3436e', // yUSDC v2
  '0x26EA744E5B887E5205727f55dFBE8685e3b21951', // yUSDC v3
  '0x83f798e925BcD4017Eb265844FDDAbb448f1707D', // yUSDT v2
  '0xE6354ed5bC4b393a5Aad09f21c46E101e692d447', // yUSDT v3
  '0x73a052500105205d34Daf004eAb301916DA8190f', // yTUSD
  '0xF61718057901F84C4eEC4339EF8f0D86D2B45600', // ySUSD
  '0x04Aa51bbcB46541455cCF1B8bef2ebc5d3787EC9'  // yWBTC
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getVaultBalances(wallet)));
    balance.push(...(await getTokenBalances(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all vault balances:
export const getVaultBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let tokenCount = parseInt(await query(chain, deployer, yearn.deployerABI, 'numTokens', []));
  let tokens = [...Array(tokenCount).keys()];
  
  // Token Multicall Query Setup:
  let tokenQueries: ContractCallContext[] = [];
  let tokenQuery: ContractCallContext = {
    reference: 'tokens',
    contractAddress: deployer,
    abi: yearn.deployerABI,
    calls: []
  }
  tokens.forEach(tokenID => {
    tokenQuery.calls.push({ reference: tokenID.toString(), methodName: 'tokens', methodParameters: [tokenID] });
  });
  tokenQueries.push(tokenQuery);

  // Token Multicall Query Results:
  let tokenMulticallResults = (await multicallQuery(chain, tokenQueries)).results;
  
  // Vault Count Multicall Query Setup:
  let vaultCountQueries: ContractCallContext[] = [];
  let vaultCountQuery: ContractCallContext = {
    reference: 'numVaults',
    contractAddress: deployer,
    abi: yearn.deployerABI,
    calls: []
  }
  tokenMulticallResults['tokens'].callsReturnContext.forEach(result => {
    if(result.success) {
      let token = result.returnValues[0] as Address;
      vaultCountQuery.calls.push({ reference: token, methodName: 'numVaults', methodParameters: [token] });
    }
  });
  vaultCountQueries.push(vaultCountQuery);

  // Vault Count Multicall Query Results:
  let vaultCountMulticallResults = (await multicallQuery(chain, vaultCountQueries)).results;

  // Vault Multicall Query Setup:
  let vaultQueries: ContractCallContext[] = [];
  let vaultQuery: ContractCallContext = {
    reference: 'vaults',
    contractAddress: deployer,
    abi: yearn.deployerABI,
    calls: []
  }
  vaultCountMulticallResults['numVaults'].callsReturnContext.forEach(result => {
    if(result.success) {
      let token = result.reference as Address;
      let vaultCount = parseBN(result.returnValues[0]);
      if(vaultCount > 0) {
        for(let i = 0; i < vaultCount; i++) {
          vaultQuery.calls.push({ reference: i.toString(), methodName: 'vaults', methodParameters: [token, i] });
        }
      }
    }
  });
  vaultQueries.push(vaultQuery);

  // Vault Multicall Query Results:
  let vaultMulticallResults = (await multicallQuery(chain, vaultQueries)).results;

  // Balance Multicall Query Setup:
  let balanceQueries: ContractCallContext[] = [];
  vaultMulticallResults['vaults'].callsReturnContext.forEach(result => {
    if(result.success) {
      let vault = result.returnValues[0] as Address;
      balanceQueries.push({
        reference: vault,
        contractAddress: vault,
        abi: minABI,
        calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
      });
    }
  });

  // Balance Multicall Query Results:
  let balanceMulticallResults = (await multicallQuery(chain, balanceQueries)).results;
  let promises = Object.keys(balanceMulticallResults).map(result => (async () => {
    let balanceResult = balanceMulticallResults[result].callsReturnContext[0];
    if(balanceResult.success) {
      let vault = balanceMulticallResults[result].originalContractCallContext.reference as Address;
      let balance = parseBN(balanceResult.returnValues[0]);
      if(balance > 0) {
        let underlyingToken = await query(chain, vault, yearn.vaultABI, 'token', []);
        let multiplier = await query(chain, vault, yearn.vaultABI, 'pricePerShare', []);
        let decimals = await query(chain, vault, minABI, 'decimals', []);
        let underlyingBalance = balance * (multiplier / (10 ** decimals));
        let symbol = await query(chain, underlyingToken, minABI, 'symbol', []);
        if(symbol.startsWith('crv') || (symbol.length > 3 && symbol.endsWith('CRV'))) {
          let newToken = await addCurveToken(chain, project, 'staked', underlyingToken, underlyingBalance, wallet);
          balances.push(newToken);
        } else {
          let newToken = await addToken(chain, project, 'staked', underlyingToken, underlyingBalance, wallet);
          balances.push(newToken);
        }
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all yToken Balances:
export const getTokenBalances = async (wallet: Address) => {
  let balances: Token[] = [];
  let promises = yTokenList.map(token => (async () => {
    let balance = parseInt(await query(chain, token, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let underlyingToken = await query(chain, token, yearn.tokenABI, 'token', []);
      let multiplier = await query(chain, token, yearn.tokenABI, 'getPricePerFullShare', []);
      let decimals = await query(chain, token, minABI, 'decimals', []);
      let underlyingBalance = balance * (multiplier / (10 ** decimals));
      let newToken = await addToken(chain, project, 'staked', underlyingToken, underlyingBalance, wallet);
      balances.push(newToken);
    }
  })());
  await Promise.all(promises);
  return balances;
}