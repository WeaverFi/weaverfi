
// Imports:
import { ethers } from 'ethers';
import { chains } from './chains';

// Type Imports:
import type { Address, ENSDomain } from './types';

/* ========================================================================================================================================================================= */

/**
 * Function to resolve an ENS domain name into an address.
 * @param name - The ENS domain name to resolve.
 * @returns An address if resolvable, else null.
 */
export const resolveENS = async (name: ENSDomain) => {
  let ethers_provider = new ethers.providers.JsonRpcProvider(chains['eth'].rpcs[0]);
  let address = await ethers_provider.resolveName(name);
  if(address) {
    return address as Address;
  }
  return null;
}

/* ========================================================================================================================================================================= */

/**
 * Function to reverse lookup an ENS domain.
 * @param address - The address to reverse lookup.
 * @returns An ENS domain name if resolvable, else null.
 */
export const lookupENS = async (address: Address) => {
  let ethers_provider = new ethers.providers.JsonRpcProvider(chains['eth'].rpcs[0]);
  let ensAddress = await ethers_provider.lookupAddress(address);
  if(ensAddress) {
    return ensAddress as ENSDomain;
  }
  return null;
}

/* ========================================================================================================================================================================= */

/**
 * Function to fetch an ENS domain's avatar.
 * @param name - The ENS domain name to query info from.
 * @returns An avatar URI if available, else null.
 */
export const fetchAvatarENS = async (name: ENSDomain) => {
  let ethers_provider = new ethers.providers.JsonRpcProvider(chains['eth'].rpcs[0]);
  let resolver = await ethers_provider.getResolver(name);
  if(resolver) {
    let avatar = await resolver.getText('avatar');
    if(avatar) {
      return avatar;
    }
  }
  return null;
}