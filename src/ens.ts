
// Imports:
import axios from 'axios';
import { ethers } from 'ethers';
import { chains } from './chains';

// Type Imports:
import type { URL, Address, ENSDomain } from './types';

// Initializations:
const ensSubgraphURL: URL = 'https://api.thegraph.com/subgraphs/name/ensdomains/ens';
const ethProvider = new ethers.providers.StaticJsonRpcProvider(chains.eth.rpcs[0]);

/* ========================================================================================================================================================================= */

/**
 * Function to resolve an ENS domain name into an address.
 * @param name The ENS domain name to resolve.
 * @returns An address if resolvable, else null.
 */
export const resolveENS = async (name: ENSDomain) => {
  let address = await ethProvider.resolveName(name);
  if(address) {
    return address as Address;
  }
  return null;
}

/* ========================================================================================================================================================================= */

/**
 * Function to reverse lookup an ENS domain.
 * @param address The address to reverse lookup.
 * @returns An ENS domain name if resolvable, else null.
 */
export const lookupENS = async (address: Address) => {
  let ensAddress = await ethProvider.lookupAddress(address);
  if(ensAddress) {
    return ensAddress as ENSDomain;
  }
  return null;
}

/* ========================================================================================================================================================================= */

/**
 * Function to fetch an ENS domain's avatar.
 * @param name The ENS domain name to query info from.
 * @returns An avatar URI if available, else null.
 */
export const fetchAvatarENS = async (name: ENSDomain) => {
  let resolver = await ethProvider.getResolver(name);
  if(resolver) {
    let avatar = await resolver.getText('avatar');
    if(avatar) {
      return avatar;
    }
  }
  return null;
}

/* ========================================================================================================================================================================= */

/**
 * Function to fetch ENS domains from subgraph.
 * @param address The address to lookup domains for.
 * @returns An array of found ENS domains.
 */
export const getSubgraphDomains = async (address: Address) => {
  let ensDomains: { name: ENSDomain, expiry: number }[] = [];
  let subgraphQuery = { query: `{ account(id: "${address.toLowerCase()}") { registrations { domain { name }, expiryDate } } }` };
  let subgraphResults: { registrations: { domain: { name: ENSDomain }, expiryDate: string }[] } | null = (await axios.post(ensSubgraphURL, subgraphQuery)).data.data.account;
  if(subgraphResults) {
    subgraphResults.registrations.forEach(registration => {
      let name = registration.domain.name;
      let expiry = parseInt(registration.expiryDate);
      ensDomains.push({ name, expiry });
    });
  }
  return ensDomains;
}