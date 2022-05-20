
// Imports:
import weaver from './index';
import { minABI } from './ABIs';
import { chains } from './chains';
import { defaultAddress } from './functions';

// Type Imports:
import type { Address } from './types';

// Initializations:
const wallet: Address = '0xbE4FeAE32210f682A41e1C41e3eaF4f8204cD29E';

/* ========================================================================================================================================================================= */

// Tests Function:
const tests = async () => {

  // Project Test:
  // let projectBalance = await weaver.ETH.getProjectBalance(wallet, 'curve');
  // console.log('🕷️ ~ projectBalance', projectBalance);

  /* ================================================== */

  // Chain-Specific Tests:
  // let allProjectBalances = await weaver.ETH.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ allProjectBalances', allProjectBalances);
  // let walletBalance = await weaver.ETH.getWalletBalance(wallet);
  // console.log('🕷️ ~ walletBalance', walletBalance);
  // let nftBalance = await weaver.ETH.getNFTBalance(wallet);
  // console.log('🕷️ ~ nftBalance', nftBalance);
  // let walletCheck = weaver.ETH.isAddress(wallet);
  // console.log('🕷️ ~ walletCheck', walletCheck);
  // let txCount = await weaver.ETH.getTXCount(wallet);
  // console.log('🕷️ ~ txCount', txCount);
  // let projects = weaver.ETH.getProjects();
  // console.log('🕷️ ~ projects', projects);
  // let tokens = weaver.ETH.getTokens();
  // console.log('🕷️ ~ tokens', tokens);
  // let queryResult = parseInt(await weaver.ETH.query(chains['eth'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ queryResult', queryResult);

  /* ================================================== */

  // Generic Tests:
  // let allChains = weaver.getAllChains();
  // console.log('🕷️ ~ allChains', allChains);
  // let allChainInfo = weaver.getAllChainInfo();
  // console.log('🕷️ ~ allChainInfo', allChainInfo);
  // let allProjects = weaver.getAllProjects();
  // console.log('🕷️ ~ allProjects', allProjects);
  // let allTokens = weaver.getAllTokens();
  // console.log('🕷️ ~ allTokens', allTokens);
  // let allBalances = await weaver.getAllBalances(wallet);
  // console.log('🕷️ ~ allBalances', allBalances);

  /* ================================================== */

  // Domain Name Tests:
  // let ensAddress = await weaver.ETH.resolveENS('ncookie.eth');
  // console.log('🕷️ ~ ensAddress', ensAddress);
  // let ensDomain = await weaver.ETH.lookupENS(wallet);
  // console.log('🕷️ ~ ensDomain', ensDomain);

  /* ================================================== */

  // Token Pricing Tests:
  // let allTokenPrices = await weaver.getAllTokenPrices();
  // console.log('🕷️ ~ allTokenPrices', allTokenPrices);
  // let nativeTokenPrices = await weaver.getNativeTokenPrices();
  // console.log('🕷️ ~ nativeTokenPrices', nativeTokenPrices);
  // let prices = weaver.fetchPrices();
  // console.log('🕷️ ~ prices', prices);
  // let tokenPrices = await weaver.ETH.getTokenPrices();
  // console.log('🕷️ ~ tokenPrices', tokenPrices);
  // let tokenPrice = await weaver.ETH.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ tokenPrice', tokenPrice);

  /* ================================================== */

  // Stopping Any Running IPFS Node:
  await weaver.stopIPFSNode();

}

/* ========================================================================================================================================================================= */

// Running Tests:
tests();