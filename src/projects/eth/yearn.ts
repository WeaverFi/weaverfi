
// Imports:
import { WeaverError } from '../../error';
import { minABI, yearn } from '../../ABIs';
import { addCurveToken } from '../../project-functions';
import { query, multicallOneContractQuery, multicallOneMethodQuery, addToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

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
  balance.push(...(await getVaultBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getVaultBalances()', err) })));
  balance.push(...(await getTokenBalances(wallet).catch((err) => { throw new WeaverError(chain, project, 'getTokenBalances()', err) })));
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all vault balances:
export const getVaultBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let tokenCount = parseInt(await query(chain, deployer, yearn.deployerABI, 'numTokens', []));
  let tokens = [...Array(tokenCount).keys()];
  
  // Token Address Multicall Query:
  let tokenCalls: CallContext[] = [];
  tokens.forEach(tokenID => {
    tokenCalls.push({ reference: tokenID.toString(), methodName: 'tokens', methodParameters: [tokenID] });
  });
  let tokenMulticallResults = await multicallOneContractQuery(chain, deployer, yearn.deployerABI, tokenCalls);

  // Vault Count Multicall Query:
  let vaultCountCalls: CallContext[] = [];
  Object.keys(tokenMulticallResults).forEach(tokenID => {
    let token: Address = tokenMulticallResults[tokenID][0];
    vaultCountCalls.push({ reference: token, methodName: 'numVaults', methodParameters: [token] });
  });
  let vaultCountMulticallResults = await multicallOneContractQuery(chain, deployer, yearn.deployerABI, vaultCountCalls);

  // Vault Address Multicall Query:
  let vaultCalls: CallContext[] = [];
  Object.keys(vaultCountMulticallResults).forEach(token => {
    let vaultCount = parseBN(vaultCountMulticallResults[token][0]);
    if(vaultCount > 0) {
      for(let i = 0; i < vaultCount; i++) {
        vaultCalls.push({ reference: token + i.toString(), methodName: 'vaults', methodParameters: [token, i] });
      }
    }
  });
  let vaultMulticallResults = await multicallOneContractQuery(chain, deployer, yearn.deployerABI, vaultCalls);

  // Balance Multicall Query:
  let vaultAddresses = Object.keys(vaultMulticallResults).map(key => vaultMulticallResults[key][0]) as Address[];
  let balanceMulticallResults = await multicallOneMethodQuery(chain, vaultAddresses, minABI, 'balanceOf', [wallet]);
  let promises = vaultAddresses.map(vault => (async () => {
    let balanceResults = balanceMulticallResults[vault];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
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
  
  // Balance Multicall Query:
  let multicallResults = await multicallOneMethodQuery(chain, yTokenList, minABI, 'balanceOf', [wallet]);
  let promises = yTokenList.map(yToken => (async () => {
    let balanceResults = multicallResults[yToken];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        let underlyingToken = await query(chain, yToken, yearn.tokenABI, 'token', []);
        let multiplier = await query(chain, yToken, yearn.tokenABI, 'getPricePerFullShare', []);
        let decimals = await query(chain, yToken, minABI, 'decimals', []);
        let underlyingBalance = balance * (multiplier / (10 ** decimals));
        let newToken = await addToken(chain, project, 'staked', underlyingToken, underlyingBalance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}