
// Imports:
import { minABI, cycle } from '../../ABIs';
import { query, addToken, addLPToken } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'avax';
const project = 'cycle';
const distributor: Address = '0x96e9778511cC9F8E5d35652497248131D235005A';
const pools: Address[] = [
  '0xE006716Ae6cAA486d77084C1cca1428fb99c877B', // CYCLE-AVAX LP: CYCLE Rewards
  '0x6140D3ED2426cbB24f07D884106D9018d49d9101', // CYCLE: AVAX Rewards
  '0x3b2EcFD19dC9Ca35097F80fD92e812a53c180CD1'  // CYCLE: xCYCLE Accrual
];
const cycleToken: Address = '0x81440C939f2C1E34fc7048E518a637205A632a74';
const wavax: Address = '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getVaultBalances(wallet)));
    balance.push(...(await getStakedCYCLE(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get vault balances:
const getVaultBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let vaultCount = parseInt(await query(chain, distributor, cycle.distributorABI, 'getVaultRewardsCount', []));
  let vaults = [...Array(vaultCount).keys()];
  let cycleRewards = 0;
  let promises = vaults.map(vault => (async () => {
    let vaultAddress = (await query(chain, distributor, cycle.distributorABI, 'rewards', [vault])).StakingRewards;
    let balance = parseInt(await query(chain, vaultAddress, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      let intermediary = await query(chain, vaultAddress, cycle.vaultABI, 'stakingToken', []);
      let lpToken = await query(chain, intermediary, cycle.intermediaryABI, 'LPtoken', []);
      let actualBalance = parseInt(await query(chain, intermediary, cycle.intermediaryABI, 'getAccountLP', [wallet]));
      let newToken = await addLPToken(chain, project, 'staked', lpToken, actualBalance, wallet);
      balances.push(newToken);

      // Pending CYCLE Rewards:
      let rewards = parseInt(await query(chain, vaultAddress, cycle.vaultABI, 'earned', [wallet]));
      if(rewards > 0) {
        cycleRewards += rewards;
      }
    }
  })());
  await Promise.all(promises);
  if(cycleRewards > 0) {
    let newToken = await addToken(chain, project, 'unclaimed', cycleToken, cycleRewards, wallet);
    balances.push(newToken);
  }
  return balances;
}

// Function to get staked CYCLE balance in 'Earn' pools:
const getStakedCYCLE = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let promises = pools.map(pool => (async () => {
    let balance = parseInt(await query(chain, pool, minABI, 'balanceOf', [wallet]));
    if(balance > 0) {
      if(pool === pools[0]) {
        let lpToken = await query(chain, pool, cycle.stakingABI, 'stakingToken', []);
        let newToken = await addLPToken(chain, project, 'staked', lpToken, balance, wallet);
        balances.push(newToken);
        let rewards = parseInt(await query(chain, pool, cycle.stakingABI, 'earned', [wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', cycleToken, rewards, wallet);
          balances.push(newToken);
        }
      } else if(pool === pools[1]) {
        let newToken = await addToken(chain, project, 'staked', cycleToken, balance, wallet);
        balances.push(newToken);
        let rewards = parseInt(await query(chain, pool, cycle.stakingABI, 'earned', [wallet]));
        if(rewards > 0) {
          let newToken = await addToken(chain, project, 'unclaimed', wavax, rewards, wallet);
          balances.push(newToken);
        }
      } else if(pool === pools[2]) {
        let actualBalance = await query(chain, pool, cycle.stakingABI, 'getAccountCYCLE', [wallet]);
        let newToken = await addToken(chain, project, 'staked', cycleToken, actualBalance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}