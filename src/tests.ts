
// Imports:
import { WeaverFi as weaver } from './index';
// import { minABI } from './ABIs';
// import type { Chain, ChainData } from './types';

// Required JSON Files:
// const chains: Record<Chain, ChainData> = require('../static/chains.json');
// const projects: Record<Chain, string[]> = require('../static/projects.json');

// Initializations:
// const wallet = '0xbE4FeAE32210f682A41e1C41e3eaF4f8204cD29E';

/* ========================================================================================================================================================================= */

// Tests Function:
const tests = async () => {

  // Project Balance Tests:
  // let projectBalance = await weaver.ETH.getProjectBalance(wallet, 'aave');
  // console.log('🕷️ ~ projectBalance', projectBalance);

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
  // let terraWalletBalance = await weaver.TERRA.getWalletBalance(wallet);
  // console.log('🕷️ ~ terraWalletBalance', terraWalletBalance);

  /* ================================================== */

  // Wallet Validation Tests:
  // let ethWalletCheck = await weaver.ETH.isWallet(wallet);
  // console.log('🕷️ ~ ethWalletCheck', ethWalletCheck);
  // let bscWalletCheck = await weaver.BSC.isWallet(wallet);
  // console.log('🕷️ ~ bscWalletCheck', bscWalletCheck);
  // let polyWalletCheck = await weaver.POLY.isWallet(wallet);
  // console.log('🕷️ ~ polyWalletCheck', polyWalletCheck);
  // let ftmWalletCheck = await weaver.FTM.isWallet(wallet);
  // console.log('🕷️ ~ ftmWalletCheck', ftmWalletCheck);
  // let avaxWalletCheck = await weaver.AVAX.isWallet(wallet);
  // console.log('🕷️ ~ avaxWalletCheck', avaxWalletCheck);
  // let oneWalletCheck = await weaver.ONE.isWallet(wallet);
  // console.log('🕷️ ~ oneWalletCheck', oneWalletCheck);
  // let terraWalletCheck = await weaver.TERRA.isWallet(wallet);
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
  // let terraQueryResult = parseInt((await weaver.TERRA.query('terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76', { balance: { address: wallet } })).balance);
  // console.log('🕷️ ~ terraQueryResult', terraQueryResult);

  /* ================================================== */

  // Generic Tests:
  let allProjects = weaver.getAllProjects();
  console.log('🕷️ ~ allProjects', allProjects);
  let allTokens = weaver.getAllTokens();
  console.log('🕷️ ~ allTokens', allTokens);

}

/* ========================================================================================================================================================================= */

// Running Tests:
tests();