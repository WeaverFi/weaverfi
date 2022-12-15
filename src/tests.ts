
// Imports:
import weaver from './index';
import { minABI } from './ABIs';
import { chains } from './chains';
import { defaultAddress } from './functions';

// Type Imports:
import type { Address, ABI } from './types';

// Example Wallet:
const wallet: Address = '0xE7B4d4b35A0F2045c6e77bfdd94B99Fb0Be961B0';

// Example ABI:
const erc20TransferEventABI: ABI = [
  { "anonymous": false, "inputs": [
    { "indexed": true, "internalType": "address", "name": "from", "type": "address" },
    { "indexed": true, "internalType": "address", "name": "to", "type": "address" },
    { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }
  ],"name": "Transfer", "type": "event" }
];

/* ========================================================================================================================================================================= */

// Tests Function:
const tests = async () => {

  // Project Test:
  let projectBalance = await weaver.eth.getProjectBalance(wallet, 'beefy');
  console.log('🕷️ ~ projectBalance', projectBalance);

  /* ================================================== */

  // Chain-Specific Tests:
  // let allProjectBalances = await weaver.eth.getAllProjectBalances(wallet);
  // console.log('🕷️ ~ allProjectBalances', allProjectBalances);
  // let walletBalance = await weaver.eth.getWalletBalance(wallet);
  // console.log('🕷️ ~ walletBalance', walletBalance);
  // let nftBalance = await weaver.eth.getNFTBalance(wallet);
  // console.log('🕷️ ~ nftBalance', nftBalance);
  // let walletCheck = weaver.eth.isAddress(wallet);
  // console.log('🕷️ ~ walletCheck', walletCheck);
  // let txCount = await weaver.eth.getTXCount(wallet);
  // console.log('🕷️ ~ txCount', txCount);
  // let projects = weaver.eth.getProjects();
  // console.log('🕷️ ~ projects', projects);
  // let tokens = weaver.eth.getTokens();
  // console.log('🕷️ ~ tokens', tokens);
  // let gasResult = await weaver.eth.getGasEstimates();
  // console.log('🕷️ ~ gasResult', gasResult);

  /* ================================================== */

  // Query Tests:
  // let queryResult = parseInt(await weaver.eth.query(chains['eth'].usdc, minABI, 'balanceOf', [wallet]));
  // console.log('🕷️ ~ queryResult', queryResult);
  // let queryBlocksResult = await weaver.eth.queryBlocks(chains['eth'].usdc, erc20TransferEventABI, 'Transfer', 50000, [], { startBlock: 15083775, endBlock: 15083778 });
  // console.log('🕷️ ~ queryBlocksResult', queryBlocksResult);

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
  // let ensAddress = await weaver.eth.resolveENS('ncookie.eth');
  // console.log('🕷️ ~ ensAddress', ensAddress);
  // let ensDomain = await weaver.eth.lookupENS(wallet);
  // console.log('🕷️ ~ ensDomain', ensDomain);
  // let ensAvatar = await weaver.eth.fetchAvatarENS('ncookie.eth');
  // console.log('🕷️ ~ ensAvatar', ensAvatar);

  /* ================================================== */

  // Token Pricing Tests:
  // let allTokenPrices = await weaver.getAllTokenPrices();
  // console.log('🕷️ ~ allTokenPrices', allTokenPrices);
  // let nativeTokenPrices = await weaver.getNativeTokenPrices();
  // console.log('🕷️ ~ nativeTokenPrices', nativeTokenPrices);
  // let prices = weaver.checkPrices();
  // console.log('🕷️ ~ prices', prices);
  // let chainPrices = weaver.eth.checkPrices();
  // console.log('🕷️ ~ chainPrices', chainPrices);
  // let tokenPrices = await weaver.eth.getTokenPrices();
  // console.log('🕷️ ~ tokenPrices', tokenPrices);
  // let tokenPrice = await weaver.eth.getTokenPrice(defaultAddress, 18);
  // console.log('🕷️ ~ tokenPrice', tokenPrice);

}

/* ========================================================================================================================================================================= */

// Running Tests:
tests();