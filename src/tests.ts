
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

  // Project Balance Tests:
  let projectBalance = await weaver.AVAX.getProjectBalance(wallet, 'curve');
  console.log('🕷️ ~ projectBalance', projectBalance);

  /* ================================================== */

  // Aggregated Project Balance Tests:
  // let ethAllProjectBalances = await weaver.ETH.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ ethAllProjectBalances', ethAllProjectBalances);
  // let bscAllProjectBalances = await weaver.BSC.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ bscAllProjectBalances', bscAllProjectBalances);
  // let polyAllProjectBalances = await weaver.POLY.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ polyAllProjectBalances', polyAllProjectBalances);
  // let ftmAllProjectBalances = await weaver.FTM.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ ftmAllProjectBalances', ftmAllProjectBalances);
  // let avaxAllProjectBalances = await weaver.AVAX.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ avaxAllProjectBalances', avaxAllProjectBalances);
  // let oneAllProjectBalances = await weaver.ONE.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ oneAllProjectBalances', oneAllProjectBalances);
  // let cronosAllProjectBalances = await weaver.CRONOS.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ cronosAllProjectBalances', cronosAllProjectBalances);

  /* ================================================== */
  
  // Wallet Balance Tests:
  // let ethWalletBalance = await weaver.ETH.getWalletBalance(wallet);
  // console.log('🕷️ ~ ethWalletBalance', ethWalletBalance);
  // let bscWalletBalance = await weaver.BSC.getWalletBalance(wallet);
  // console.log('🕷️ ~ bscWalletBalance', bscWalletBalance);
  // let polyWalletBalance = await weaver.POLY.getWalletBalance(wallet);
  // console.log('🕷️ ~ polyWalletBalance', polyWalletBalance);
  // let ftmWalletBalance = await weaver.FTM.getWalletBalance(wallet);
  // console.log('🕷️ ~ ftmWalletBalance', ftmWalletBalance);
  // let avaxWalletBalance = await weaver.AVAX.getWalletBalance(wallet);
  // console.log('🕷️ ~ avaxWalletBalance', avaxWalletBalance);
  // let oneWalletBalance = await weaver.ONE.getWalletBalance(wallet);
  // console.log('🕷️ ~ oneWalletBalance', oneWalletBalance);
  // let cronosWalletBalance = await weaver.CRONOS.getWalletBalance(wallet);
  // console.log('🕷️ ~ cronosWalletBalance', cronosWalletBalance);

  /* ================================================== */

  // Address Validation Tests:
  // let ethWalletCheck = weaver.ETH.isAddress(wallet);
  // console.log('🕷️ ~ ethWalletCheck', ethWalletCheck);
  // let bscWalletCheck = weaver.BSC.isAddress(wallet);
  // console.log('🕷️ ~ bscWalletCheck', bscWalletCheck);
  // let polyWalletCheck = weaver.POLY.isAddress(wallet);
  // console.log('🕷️ ~ polyWalletCheck', polyWalletCheck);
  // let ftmWalletCheck = weaver.FTM.isAddress(wallet);
  // console.log('🕷️ ~ ftmWalletCheck', ftmWalletCheck);
  // let avaxWalletCheck = weaver.AVAX.isAddress(wallet);
  // console.log('🕷️ ~ avaxWalletCheck', avaxWalletCheck);
  // let oneWalletCheck = weaver.ONE.isAddress(wallet);
  // console.log('🕷️ ~ oneWalletCheck', oneWalletCheck);
  // let cronosWalletCheck = weaver.CRONOS.isAddress(wallet);
  // console.log('🕷️ ~ cronosWalletCheck', cronosWalletCheck);

  /* ================================================== */

  // Address Validation Tests:
  // let ethTXCount = await weaver.ETH.getTXCount(wallet);
  // console.log('🕷️ ~ ethTXCount', ethTXCount);
  // let bscTXCount = await weaver.BSC.getTXCount(wallet);
  // console.log('🕷️ ~ bscTXCount', bscTXCount);
  // let polyTXCount = await weaver.POLY.getTXCount(wallet);
  // console.log('🕷️ ~ polyTXCount', polyTXCount);
  // let ftmTXCount = await weaver.FTM.getTXCount(wallet);
  // console.log('🕷️ ~ ftmTXCount', ftmTXCount);
  // let avaxTXCount = await weaver.AVAX.getTXCount(wallet);
  // console.log('🕷️ ~ avaxTXCount', avaxTXCount);
  // let oneTXCount = await weaver.ONE.getTXCount(wallet);
  // console.log('🕷️ ~ oneTXCount', oneTXCount);
  // let cronosTXCount = await weaver.CRONOS.getTXCount(wallet);
  // console.log('🕷️ ~ cronosTXCount', cronosTXCount);

  /* ================================================== */

  // Project Listing Tests:
  // let ethProjects = weaver.ETH.getProjects();
  // console.log('🕷️ ~ ethProjects', ethProjects);
  // let bscProjects = weaver.BSC.getProjects();
  // console.log('🕷️ ~ bscProjects', bscProjects);
  // let polyProjects = weaver.POLY.getProjects();
  // console.log('🕷️ ~ polyProjects', polyProjects);
  // let ftmProjects = weaver.FTM.getProjects();
  // console.log('🕷️ ~ ftmProjects', ftmProjects);
  // let avaxProjects = weaver.AVAX.getProjects();
  // console.log('🕷️ ~ avaxProjects', avaxProjects);
  // let oneProjects = weaver.ONE.getProjects();
  // console.log('🕷️ ~ oneProjects', oneProjects);
  // let cronosProjects = weaver.CRONOS.getProjects();
  // console.log('🕷️ ~ cronosProjects', cronosProjects);

  /* ================================================== */

  // Token Listing Tests:
  // let ethTokens = weaver.ETH.getTokens();
  // console.log('🕷️ ~ ethTokens', ethTokens);
  // let bscTokens = weaver.BSC.getTokens();
  // console.log('🕷️ ~ bscTokens', bscTokens);
  // let polyTokens = weaver.POLY.getTokens();
  // console.log('🕷️ ~ polyTokens', polyTokens);
  // let ftmTokens = weaver.FTM.getTokens();
  // console.log('🕷️ ~ ftmTokens', ftmTokens);
  // let avaxTokens = weaver.AVAX.getTokens();
  // console.log('🕷️ ~ avaxTokens', avaxTokens);
  // let oneTokens = weaver.ONE.getTokens();
  // console.log('🕷️ ~ oneTokens', oneTokens);
  // let cronosTokens = weaver.CRONOS.getTokens();
  // console.log('🕷️ ~ cronosTokens', cronosTokens);

  /* ================================================== */

  // Query Tests:
  // let ethQueryResult = parseInt(await weaver.ETH.query(chains['eth'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ ethQueryResult', ethQueryResult);
  // let bscQueryResult = parseInt(await weaver.BSC.query(chains['bsc'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ bscQueryResult', bscQueryResult);
  // let polyQueryResult = parseInt(await weaver.POLY.query(chains['poly'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ polyQueryResult', polyQueryResult);
  // let ftmQueryResult = parseInt(await weaver.FTM.query(chains['ftm'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ ftmQueryResult', ftmQueryResult);
  // let avaxQueryResult = parseInt(await weaver.AVAX.query(chains['avax'].usdc, ABIs.minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ avaxQueryResult', avaxQueryResult);
  // let oneQueryResult = parseInt(await weaver.ONE.query(chains['one'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ oneQueryResult', oneQueryResult);
  // let cronosQueryResult = parseInt(await weaver.CRONOS.query(chains['cronos'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ cronosQueryResult', cronosQueryResult);

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
  // let allTokenPrices = await weaver.getAllTokenPrices();
  // console.log('🕷️ ~ allTokenPrices', allTokenPrices);
  // let nativeTokenPrices = await weaver.getNativeTokenPrices();
  // console.log('🕷️ ~ nativeTokenPrices', nativeTokenPrices);
  // let prices = weaver.fetchPrices();
  // console.log('🕷️ ~ prices', prices);
  // let allBalances = await weaver.getAllBalances(wallet);
  // console.log('🕷️ ~ allBalances', allBalances);

  /* ================================================== */

  // Domain Name Tests:
  // let ensAddress = await weaver.ETH.resolveENS('ncookie.eth');
  // console.log('🕷️ ~ ensAddress', ensAddress);
  // let ensDomain = await weaver.ETH.lookupENS(wallet);
  // console.log('🕷️ ~ ensDomain', ensDomain);

  /* ================================================== */

  // Chain-Specific Token Pricing Tests:
  // let ethTokenPrices = await weaver.ETH.getTokenPrices();
  // console.log('🕷️ ~ ethTokenPrices', ethTokenPrices);
  // let bscTokenPrices = await weaver.BSC.getTokenPrices();
  // console.log('🕷️ ~ bscTokenPrices', bscTokenPrices);
  // let polyTokenPrices = await weaver.POLY.getTokenPrices();
  // console.log('🕷️ ~ polyTokenPrices', polyTokenPrices);
  // let ftmTokenPrices = await weaver.FTM.getTokenPrices();
  // console.log('🕷️ ~ ftmTokenPrices', ftmTokenPrices);
  // let avaxTokenPrices = await weaver.AVAX.getTokenPrices();
  // console.log('🕷️ ~ avaxTokenPrices', avaxTokenPrices);
  // let oneTokenPrices = await weaver.ONE.getTokenPrices();
  // console.log('🕷️ ~ oneTokenPrices', oneTokenPrices);
  // let cronosTokenPrices = await weaver.CRONOS.getTokenPrices();
  // console.log('🕷️ ~ cronosTokenPrices', cronosTokenPrices);

  /* ================================================== */

  // Single Token Pricing Tests:
  // let ethTokenPrice = await weaver.ETH.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ ethTokenPrice', ethTokenPrice);
  // let bscTokenPrice = await weaver.BSC.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ bscTokenPrice', bscTokenPrice);
  // let polyTokenPrice = await weaver.POLY.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ polyTokenPrice', polyTokenPrice);
  // let ftmTokenPrice = await weaver.FTM.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ ftmTokenPrice', ftmTokenPrice);
  // let avaxTokenPrice = await weaver.AVAX.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ avaxTokenPrice', avaxTokenPrice);
  // let oneTokenPrice = await weaver.ONE.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ oneTokenPrice', oneTokenPrice);
  // let cronosTokenPrice = await weaver.CRONOS.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ cronosTokenPrice', cronosTokenPrice);

}

/* ========================================================================================================================================================================= */

// Running Tests:
tests();