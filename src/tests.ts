
// Imports:
import { WeaverFi as weaver } from './index';
import { chains } from './chains';
import { minABI } from './ABIs';
import type { Address, TerraAddress } from './types';

// Initializations:
const wallet: Address | TerraAddress = '0x72CB40A11781Ff0149abB55a1AdEbE2407575030';
const defaultAddress: Address = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

/* ========================================================================================================================================================================= */

// Tests Function:
const tests = async () => {

  // Project Balance Tests:
  let projectBalance = await weaver.ETH.getProjectBalance(wallet, 'apwine');
  console.log('🕷️ ~ projectBalance', projectBalance);

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
  // let terraWalletBalance = await weaver.TERRA.getWalletBalance(wallet);
  // console.log('🕷️ ~ terraWalletBalance', terraWalletBalance);

  /* ================================================== */

  // Address Validation Tests:
  // let ethWalletCheck = await weaver.ETH.isAddress(wallet);
  // console.log('🕷️ ~ ethWalletCheck', ethWalletCheck);
  // let bscWalletCheck = await weaver.BSC.isAddress(wallet);
  // console.log('🕷️ ~ bscWalletCheck', bscWalletCheck);
  // let polyWalletCheck = await weaver.POLY.isAddress(wallet);
  // console.log('🕷️ ~ polyWalletCheck', polyWalletCheck);
  // let ftmWalletCheck = await weaver.FTM.isAddress(wallet);
  // console.log('🕷️ ~ ftmWalletCheck', ftmWalletCheck);
  // let avaxWalletCheck = await weaver.AVAX.isAddress(wallet);
  // console.log('🕷️ ~ avaxWalletCheck', avaxWalletCheck);
  // let oneWalletCheck = await weaver.ONE.isAddress(wallet);
  // console.log('🕷️ ~ oneWalletCheck', oneWalletCheck);
  // let cronosWalletCheck = await weaver.CRONOS.isAddress(wallet);
  // console.log('🕷️ ~ cronosWalletCheck', cronosWalletCheck);
  // let terraWalletCheck = await weaver.TERRA.isAddress(wallet);
  // console.log('🕷️ ~ terraWalletCheck', terraWalletCheck);

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
  // let terraProjects = weaver.TERRA.getProjects();
  // console.log('🕷️ ~ terraProjects', terraProjects);

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
  // let terraTokens = weaver.TERRA.getTokens();
  // console.log('🕷️ ~ terraTokens', terraTokens);

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
  // let terraQueryResult = parseInt((await weaver.TERRA.query('terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76', { balance: { address: wallet } })).balance);
  // console.log('🕷️ ~ terraQueryResult', terraQueryResult);

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

  /* ================================================== */

  // Domain Name Tests:
  // let ensAddress = await weaver.ETH.resolveENS('ncookie.eth');
  // console.log('🕷️ ~ ensAddress', ensAddress);
  // let ensDomain = await weaver.ETH.lookupENS(wallet);
  // console.log('🕷️ ~ ensDomain', ensDomain);
  // let tnsAddress = await weaver.TERRA.resolveTNS('ncookie.ust');
  // console.log('🕷️ ~ tnsAddress', tnsAddress);
  // let tnsDomain = await weaver.TERRA.lookupTNS(wallet);
  // console.log('🕷️ ~ tnsDomain', tnsDomain);

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
  // let terraTokenPrices = await weaver.TERRA.getTokenPrices();
  // console.log('🕷️ ~ terraTokenPrices', terraTokenPrices);

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
  // let terraTokenPrice = await weaver.TERRA.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ terraTokenPrice', terraTokenPrice);

}

/* ========================================================================================================================================================================= */

// Running Tests:
tests();