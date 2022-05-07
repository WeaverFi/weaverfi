
// Imports:
import { minABI } from '../../ABIs';
import { multicallOneMethodQuery, addBalancerToken, parseBN } from '../../functions';
import type { Chain, Address, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'poly';
const project = 'balancer';
const vault: Address = '0xBA12222222228d8Ba445958a75a0704d566BF2C8';
const pools: Address[] = [
  '0x01abc00E86C7e258823b9a055Fd62cA6CF61a163',
  '0x021c343C6180f03cE9E48FaE3ff432309b9aF199',
  '0x0297e37f1873D2DAb4487Aa67cD56B58E2F27875',
  '0x03cD191F589d12b0582a99808cf19851E468E6B5',
  '0x06Df3b2bbB68adc8B0e302443692037ED9f91b42',
  '0x09804CaEA2400035b18E2173fdD10EC8b670cA09',
  '0x0a9E96988E21c9A03B8DC011826A00259e02C46e',
  '0x148CE9b50bE946a96e94A4f5479b771bAB9B1c59',
  '0x15432bA000e58E3c0aE52A5dEc0579215EBC75D0',
  '0x186084fF790C65088BA694Df11758faE4943EE9E',
  '0x2D6e3515C8b47192Ca3913770fa741d3C4Dac354',
  '0x32FC95287b14eAeF3Afa92CCCC48C285eE3a280a',
  '0x344e8f99a55DA2ba6B4b5158df2143374E400DF2',
  '0x36128D5436d2d70cab39C9AF9CcE146C38554ff0',
  '0x38A01c45D86b61A70044fB2A76eAC8e75B1ac78E',
  '0x39Cd55FF7E7d7C66D7D2736f1d5D4791cDab895B',
  '0x3A19030Ed746bD1C3f2B0f996FF9479aF04C5F0A',
  '0x41175c3ee2Dd49FCa9b263F49525c069095b87C7',
  '0x45910fafF3cBf990FdB204682e93055506682d17',
  '0x4626d81b3a1711bEb79f4CEcFf2413886d461677',
  '0x494B26D4aEE801Cb1fabF498Ee24f0af20238743',
  '0x4E7f40cD37CEE710f5e87AD72959d30ef8a01A5D',
  '0x503717B3Dc137e230AFC7c772520D7974474fB70',
  '0x571046EaE58C783f29f95ADBa17Dd561Af8a8712',
  '0x58aF920D9Dc0bc4e8F771FF013D79215CabcaA9e',
  '0x59e2563c08029F13F80CBa9Eb610bfD0367eD266',
  '0x5c6Ee304399DBdB9C8Ef030aB642B10820DB8F56',
  '0x606e3CCC8C51cbbB1Ff07AD03c6F95a84672ab16',
  '0x614b5038611729ed49e0dED154d8A5d3AF9D1D9E',
  '0x61d5dc44849c9C87b0856a2a311536205C96c7FD',
  '0x647c1FD457b95b75D0972fF08FE01d7D7bda05dF',
  '0x67F8FCb9D3c463da05DE1392EfDbB2A87F8599Ea',
  '0x72Ab6fF76554f90532E2809Cee019ade724e029a',
  '0x7320d680Ca9BCE8048a286f00A79A2c9f8DCD7b3',
  '0x7Bf521b4f4C1543A622e11eE347EFB1a23743322',
  '0x7EB878107Af0440F9E776f999CE053D277c8Aca8',
  '0x80bE0c303D8Ad2A280878b50a39B1ee8E54DBD22',
  '0x8bDa1AB5eEad21547Ba0f33c07c86C5Dc48D9Baa',
  '0x991aeafbe1B1C7ac8348DC623AE350768d0C65b3',
  '0x9E7fD25Ad9D97F1e6716fa5bB04749A4621e892d',
  '0x9F19a375709BAF0E8e35C2c5c65aca676c4C7191',
  '0xA6F548DF93de924d73be7D25dC02554c6bD66dB5',
  '0xB2634e2BFab9664F603626afc3D270BE63c09adE',
  '0xB6b9B165C4AC3f5233A0CF413126C72Be28B468A',
  '0xb82A45ea7C6d7c90bD95e9e2aF13242538F2e269',
  '0xC6A5032dC4bF638e15b4a66BC718ba7bA474FF73',
  '0xce66904B68f1f070332Cbc631DE7ee98B650b499',
  '0xd16847480D6bc218048CD31Ad98b63CC34e5c2bF',
  '0xD208168d2A512240Eb82582205D94a0710BCe4E7',
  '0xd47c0734a0b5feFf3bB2FC8542Cd5B9751aFeEfB',
  '0xd57b0Ee9e080E3f6Aa0C30BAE98234359e97Ea98',
  '0xD5D7bc115B32ad1449C6D0083E43C87be95F2809',
  '0xdB1db6E248d7Bb4175f6E5A382d0A03fe3DCc813',
  '0xdB3e5Cf969c05625Db344deA9C8b12515e235Df3',
  '0xDe620bb8BE43ee54d7aa73f8E99A7409Fe511084',
  '0xe0947A0D847f9662a6a22cA2efF9D7E6352a123e',
  '0xe2cD73cfeB471f9F2b08A18afbc87Ff2324eF24E',
  '0xE54B3F5c444a801e61BECDCa93e74CdC1C4C1F90',
  '0xe8075304A388f2f9B2af61f502741a88Ff21D9A4',
  '0xEA8886a24b6e01Fba88A9e98d794e8D1F29eD863',
  '0xeB58bE542E77195355d90100beb07105B9BD295E',
  '0xF099b7C3BD5A221Aa34Cb83004a50D66B0189ad0',
  '0xf461f2240B66D55Dcf9059e26C022160C06863BF',
  '0xF7cd489C2b7E199e2d3E8A982Eb6FD51d71c1ce4',
  '0xf93E20844Fd084b657D5e71342157b36C5F3032D',
  '0xF94A7Df264A2ec8bCEef2cFE54d7cA3f6C6DFC7a',
  '0xFeadd389a5c427952D8fdb8057D6C8ba1156cC56'
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
  } catch(err) {
    console.log('🍪 ~ err', err);
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get all pool balances:
export const getPoolBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  
  // Balance Multicall Query:
  let multicallResults = await multicallOneMethodQuery(chain, pools, minABI, 'balanceOf', [wallet]);
  let promises = pools.map(pool => (async () => {
    let balanceResults = multicallResults[pool];
    if(balanceResults) {
      let balance = parseBN(balanceResults[0]);
      if(balance > 0) {
        let newToken = await addBalancerToken(chain, project, 'staked', pool, balance, wallet);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}