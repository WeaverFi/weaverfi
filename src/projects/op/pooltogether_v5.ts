
// Imports:
import { BigNumber } from 'ethers';
import { minABI, pooltogether } from '../../ABIs';
import { WeaverError } from '../../error';
import { query, addXToken } from '../../functions';

// Type Imports:
import type { Chain, Address, XToken } from '../../types';

// Initializations:
const chain: Chain = 'op';
const project = 'pooltogether_v5';

interface PrizeVault {
  address: Address
  decimals: number
  underlyingAddress: Address
}

const vaults: PrizeVault[] = [
  { address: '0xE3B3a464ee575E8E25D2508918383b89c832f275', underlyingAddress: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', decimals: 6 },
  { address: '0x29Cb69D4780B53c1e5CD4D2B817142D2e9890715', underlyingAddress: '0x4200000000000000000000000000000000000006', decimals: 18 },
  { address: '0xCe8293f586091d48A0cE761bBf85D5bCAa1B8d2b', underlyingAddress: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', decimals: 18 }
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  const balance: XToken[] = [];
  const promises = vaults.map(vault => (async () => {
    balance.push(...(await getPrizeVaultBalance(wallet, vault).catch((err) => { throw new WeaverError(chain, project, 'getPrizeVaultBalance()', err) })));
  })());
  await Promise.all(promises);
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get prize vault balance:
export const getPrizeVaultBalance = async (wallet: Address, vault: PrizeVault) => {
  const balance = parseInt(await query(chain, vault.address, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    const underlyingBalance = parseInt(await query(chain, vault.address, pooltogether.prizeVaultABI, 'convertToAssets', [BigNumber.from(balance.toString())]));
    const newToken = await addXToken(chain, project, 'staked', vault.address, balance, wallet, vault.underlyingAddress, underlyingBalance, vault.address);
    return [newToken];
  } else {
    return [];
  }
}
