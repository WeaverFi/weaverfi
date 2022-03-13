
// Imports:
import { minABI, autofarm } from '../../ABIs';
import { initResponse, query, addToken, addLPToken, add4BeltToken, addBeltToken, addAlpacaToken } from '../../functions';
import type { Request } from 'express';
import type { Chain, Address, Token, LPToken } from 'cookietrack-types';

// Initializations:
const chain: Chain = 'bsc';
const project = 'autofarm';
const registry: Address = '0x0895196562C7868C5Be92459FaE7f877ED450452';
const autoVault: Address = '0x763a05bdb9f8946d8C3FA72d1e0d3f5E68647e5C';
const auto: Address = '0xa184088a740c695e156f91f5cc086a06bb78b827';
const ignoreVaults: number[] = [331];

/* ========================================================================================================================================================================= */

// GET Function:
export const get = async (req: Request) => {

  // Initializing Response:
  let response = initResponse(req);

  // Fetching Response Data:
  if(response.status === 'ok') {
    try {
      let wallet = req.query.address as Address;
      response.data.push(...(await getVaultBalances(wallet)));
    } catch(err: any) {
      console.error(err);
      response.status = 'error';
      response.data = [{error: 'Internal API Error'}];
    }
  }

  // Returning Response:
  return JSON.stringify(response, null, ' ');
}

/* ========================================================================================================================================================================= */

// Function to get all vault balances:
const getVaultBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let autoRewards = 0;
  let poolLength = parseInt(await query(chain, registry, autofarm.registryABI, 'poolLength', []));
  let vaults = [...Array(poolLength).keys()];
  let promises = vaults.map(vaultID => (async () => {

    // AUTO Vault:
    if(vaultID === 0) {
      let balance = parseInt(await query(chain, autoVault, autofarm.registryABI, 'stakedWantTokens', [0, wallet]));
      if(balance > 300000000000) {
        let newToken = await addToken(chain, project, 'staked', auto, balance, wallet);
        balances.push(newToken);
      }
    
    // All Other Vaults:
    } else if(!ignoreVaults.includes(vaultID)) {
      let balance = parseInt(await query(chain, registry, autofarm.registryABI, 'stakedWantTokens', [vaultID, wallet]));
      if(balance > 99) {
        let token = (await query(chain, registry, autofarm.registryABI, 'poolInfo', [vaultID]))[0];
        let symbol = await query(chain, token, minABI, 'symbol', []);

        // Regular LP Vaults:
        if(symbol.endsWith('LP')) {
          let newToken = await addLPToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // 4Belt Vault:
        } else if(symbol === '4Belt') {
          let newToken = await add4BeltToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // Belt Vaults:
        } else if(symbol.startsWith('belt')) {
          let newToken = await addBeltToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // Alpaca Vaults:
        } else if(symbol.startsWith('ib')) {
          let newToken = await addAlpacaToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);

        // Single-Asset Vaults:
        } else {
          let newToken = await addToken(chain, project, 'staked', token, balance, wallet);
          balances.push(newToken);
        }

        // Pending AUTO Rewards:
        let rewards = parseInt(await query(chain, registry, autofarm.pendingRewardsABI, 'pendingAUTO', [vaultID, wallet]));
        if(rewards > 0) {
          autoRewards += rewards;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(autoRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', auto, autoRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}