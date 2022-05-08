
// Imports:
import { minABI, beethovenx } from '../../ABIs';
import { addBalancerLikeToken } from '../../project-functions';
import { query, multicallOneMethodQuery, multicallOneContractQuery, addToken, parseBN } from '../../functions';

// Type Imports:
import type { Chain, Address, Token, LPToken, CallContext } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'beethovenx';
const masterChef: Address = '0x8166994d9ebBe5829EC86Bd81258149B87faCfd3';
const vault: Address = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';
const beetsToken: Address = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e';
const fBeetAddress: Address = '0xfcef8a994209d6916EB2C86cDD2AFD60Aa6F54b1';
const pools: Address[] = [
  '0x0073AB9F483b1d8fc1495Cd2c0cd61Eb456D0b8a',
  '0x0202975FeC570d4BeBc5A3fbEA5AA8013A24a39c',
  '0x03465ACFd0BBa1bB0b8E59431c4D58304E00d607',
  '0x034903FDE8e94b4666bB1e018758123ddFBBcEA5',
  '0x03c6B3f09D2504606936b1A4DeCeFaD204687890',
  '0x0459A6E0478644A87EE1371ecF944F403Ac65522',
  '0x0a42326C6ee024f314c7E8dc5e8BD4af194D548F',
  '0x0D344D2deC87BDb1Aaa9Cc989B4866a67b2a851F',
  '0x1577Eb091D3933A89BE62130484e090bb8BD0E58',
  '0x175511EeD1a2Bcb68E4e87820b903b0797Ab9dbF',
  '0x1b1d74A1Ab76338653E3AAaE79634D6A153d6514',
  '0x1F7b903571370FEd9FC95B1A9862d78A2127B30e',
  '0x20544612a03e52d992a11792c1142b5857E3eff7',
  '0x20bc78A63A70E2aF5a8298B39FD4f841EE295eF4',
  '0x22B30B00e6796Daf710fBE5cAFBFc9Cdd1377f2A',
  '0x27dB386491ED1bf2af61Ac398A83835E2a35F720',
  '0x2975035545008935152FdF48ca13406cc5D4e475',
  '0x2Ba4953C75860e70Cd70f15a2D5Fe07DE832Bcd1',
  '0x2BeA17EdE5D83ad19ae112B8592AadaA2B015De7',
  '0x2C580C6F08044D6dfACA8976a66C8fAddDBD9901',
  '0x2Cea0dA40cF133721377bB2b0bF4aDc43715BFC3',
  '0x2ed55f12e700CdE978E1F0491D681919814ca44B',
  '0x30A92a4EEca857445F41E4Bb836e64D66920F1C0',
  '0x389b4E90205AD6a89E19fBB532D2a3323837000C',
  '0x3bd4c3d1f6F40d77B2e9d0007D6f76E4F183A46d',
  '0x41870439b607A29293D48f7c9da10e6714217624',
  '0x431179854DCd5fF1F2bEDdC84dFe6422c5FAa786',
  '0x43d668c6F709C9D7f05C9404707A10d968B0348c',
  '0x4885b55e41fb34196235685780A07085A7aC11fa',
  '0x4A6DD05B3Ef98f32641882a1af5DDA62161f709e',
  '0x4e4E5a60c73dfedD86b0206d7c6D44CBa8D55B27',
  '0x4Ff9D9F23BA96E4B6ceb0A14B56c5E0500D18fF9',
  '0x53D56bb671bA55b77ce3A7d2e4b0230e187045aE',
  '0x55abBcB4A6B2ed72F42415758450A5549B78f955',
  '0x56897aDd6Dc6abCcf0adA1EB83D936818Bc6cA4D',
  '0x5Bb2DeE206C2bCc5768B9B2865eA971Bd9c0fF19',
  '0x5E02aB5699549675A6d3BEEb92A62782712D0509',
  '0x5E65474c8400d0BB76eDBBE066B2D2E7b0b6e7fb',
  '0x5ecF67ABFB080379Da0a9AeFA18b04B2352f61bE',
  '0x632f7F043B75C7137c3c7ECBb9D8172c692C998f',
  '0x63386eF152E1Ddef96c065636D6cC0165Ff33291',
  '0x644dD9c08E1848CAe0dDF892686a642AcEfc9cCf',
  '0x64b301E21d640F9bef90458B0987d81fb4cf1B9e',
  '0x64DdBD6c6Ad58e79F0d8cE4DCD0Cf3c82167EEe4',
  '0x65Bf2d53BD1d7050d22873f6B9Bb59edb0cA0b20',
  '0x67F40EF38ED3A4D30b1F1d527D4d05Ea0195a188',
  '0x6cF1B74a1c3d4016143F28992EF236aA5C2e0cDD',
  '0x6d12D3fE16dD83115254a32B273B05Ac5444C349',
  '0x6D414C77EcEF1fF33d6423Baf21Dea3AE381766E',
  '0x6FDC8415B654B0F60475944A0b9421Dc36ee1363',
  '0x7010030d6db6B748A8db068C7012525ad9a4cad1',
  '0x709024Ced2F087d8E658ad8Cc928246671169EF9',
  '0x70Ea0DD6Fe9016f2e46D17fA3cb709062574d69f',
  '0x713ee620a7702b79eA5413096A90702244FE4532',
  '0x71d159Ee565912009C80d1dF2053921C6a5E7732',
  '0x72C0eB973Dc95e2d185563f58fC26626CC2e8034',
  '0x75A1F077BC0B9B0E58E750e7e77E4433bAb30AA4',
  '0x7aE6A223cde3A17E0B95626ef71A2DB5F03F540A',
  '0x7cA132d9E8c420b84578a6618F10b23545513058',
  '0x7d52245d6923A245ccDDa1c27B8b309C32CAF044',
  '0x8437aCA2C2fE814DED80302fe8EB60b5353eC3f7',
  '0x84cbC248B318E23c63586d7f70e451F0C13B96D1',
  '0x851553FD9BCd28Befe450d3cfbB3f86F13832a1d',
  '0x85D9b554528DA0C3641c1bA92F658A011F126523',
  '0x8935989412b74CbAe41b406BB319d66d5B35d461',
  '0x8B858Eaf095A7337dE6f9bC212993338773cA34e',
  '0x8Bb1839393359895836688165f7c5878f8C81C5e',
  '0x8C3C964C2d08679d3D09866CF62C5b14a5346479',
  '0x8DBB92ca6c399792AC07510a0996C59902cD75a1',
  '0x8E1e0e35Cf1cC91D96F7EdDC705991d5d29eD86F',
  '0x8e82e904dD9Cb298D324c2c27929ca473d3e9BB0',
  '0x8F6a658056378558fF88265f7c9444A0FB4DB4be',
  '0x8FdD16a23aEBe95B928f1863760618E9EC29e72D',
  '0x8FE1A318e67bC203180ADF68007613546E8af393',
  '0x9524f3A1C02176eBD36bDb445912afd67FcE4E40',
  '0x979a066CA6e6ECB3Fe9f48d713004deaDf25d73B',
  '0x985976228a4685Ac4eCb0cfdbEeD72154659B6d9',
  '0x98676c6BE8D6bBC2B7CCb8CBF9110ED13EcCDEE6',
  '0x9a5cbA29F557629E915ff109B4945E66E38E87eF',
  '0x9af1F0e9aC9C844A4a4439d446c1437807183075',
  '0xA07De66AeF84e2c01D88a48D57D1463377Ee602b',
  '0xA0D24F37607f4da14d74fF42D46e093f42888c89',
  '0xA1C5698A042638b6220e336Ed9cFAFb499560c20',
  '0xa216AA5d67Ef95DdE66246829c5103C7843d1AAB',
  '0xa27B83406e627D6ed2422979d704f7DE5CCBF57B',
  '0xA396B308B3366eb2e4C0A0cd30657a72a4B2812E',
  '0xa6534F59D0F875bEA636A987968B378bb5F5A3e9',
  '0xa6cf803866312dBb462b46Ef3eC10DF619c05147',
  '0xa77597F1B75Ea285B3Be5a07D9Cc53eF388ceA4F',
  '0xa7d0a9923F9DAD318C1141A12cEEfB2d9C6eEdF7',
  '0xA85CcAe7948ff87e2e90e5a0a37C40dAa7bB9278',
  '0xab7f6edb5405324D77A1b7a2802903F6f0E0F092',
  '0xafE001c7Cbb82d8D593963D8E9e63A1250c68806',
  '0xB1590f7C53ca796b5af215465832c43ea03f4595',
  '0xB45669432DE2b94680392Ce4f2F8CBAAe5908b76',
  '0xB59244b5C76224C54373dde3E62301cF4f91895a',
  '0xb8121da4bDc666B7FAd4DB5A5c8b5cf9884D058E',
  '0xbb4607beDE4610e80d35C15692eFcB7807A2d0A6',
  '0xc042EF6cA08576BdFb57d3055A7654344fd153E4',
  '0xc14e339D66F3DDba733254f14e7F744e7d29CC8f',
  '0xc4dAC57A46a0a1acd0eB95EDDeF5257926279960',
  '0xC7f084bCB91F779617B41602f85102849098D6a2',
  '0xC87b89D7Ddd517056E623AdaF080A1Dfb465E4C4',
  '0xc98E9C812F5137667058978650d563a5D7f7A642',
  '0xC9Ba718A71bFA34cedEa910AC37B879e5913c14e',
  '0xCc31CD8293FA9Da71670b08d80871A3d4F785e0F',
  '0xCcA3a9F9e91A9F630b84e1df2FedCFE98fd800C9',
  '0xCCF8C0C978D3C36DcE62799742272bA05eDc6C1A',
  '0xCD83CD3650B320a5104d56A8A22c32c7671f82Cd',
  '0xcdE5a11a4ACB4eE4c805352Cec57E236bdBC3837',
  '0xcdF68a4d525Ba2E90Fe959c74330430A5a6b8226',
  '0xcF9d4940FE4C194C83d4D3B1de4C2DFF4233f612',
  '0xd0003b4dd0336d82e6E0843532Bb0918794a6f0d',
  '0xD163415BD34EF06f57C58D2AEd5A5478AfB464cC',
  '0xd47D2791d3B46f9452709Fa41855a045304D6f9d',
  '0xD57Cda2caEBb9B64BB88905C4dE0F0Da217a77d7',
  '0xD7B06aC72606F194AA0F09508530B6f45Bf11E34',
  '0xE03C7544E2B7c243e0711AB52A737E4e1A8a4bBa',
  '0xe1b6b8cB5cb2F0E3eC504B909dC2579f201C9564',
  '0xe402555EFa3b232ee8Bc4c79A446B47b38B93EBF',
  '0xeCAa1cBd28459d34B766F9195413Cb20122Fb942',
  '0xf0e2c47d4C9FBBbc2F2E19ACdaA3c773A3ECD221',
  '0xF2b2103E1351c4D47b27eFC8100bb264364FA92C',
  '0xF361e16F3dF7f176C8A223CB9f1B81ef86f118d5',
  '0xf3A602d30dcB723A74a0198313a7551FEacA7DAc',
  '0xF3f0970BCA8ce7E9672d17a301b54D1485D93807',
  '0xF54591700AC66A0C921cf5856e6c7019aebc87F9',
  '0xf5c690b7Af4fDC551eC89aCbaD91C6D646762A93',
  '0xf7bF0f161d3240488807FFa23894452246049916',
  '0xF8adB589cd7C2972761eDC0b7d6D9ba6fE47723b',
  '0xF8E4e42643e8FdF48fbf8D10071a07305eAaCf99',
  '0xF8fa40d35a3271eE5747FaDc63634fA673590651',
  '0xfA901cAdCAf38cd533E8B1f693D090Fc7005658e',
  '0xfC092F85125907fFcb0f9012e6e40B3f37c4De60',
  '0xFEd8DdC3339b13C9E7670057Dd5e13edc4FB747c'
];

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: Address) => {
  let balance: (Token | LPToken)[] = [];
  try {
    balance.push(...(await getPoolBalances(wallet)));
    balance.push(...(await getStakedBalances(wallet)));
  } catch {
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
        let newToken = await addBalancerLikeToken(chain, project, 'liquidity', pool, balance, wallet, vault);
        balances.push(newToken);
      }
    }
  })());
  await Promise.all(promises);
  return balances;
}

// Function to get all staked pool balances:
export const getStakedBalances = async (wallet: Address) => {
  let balances: (Token | LPToken)[] = [];
  let numRewardPools = parseInt(await query(chain, masterChef, beethovenx.masterChefABI, 'poolLength', []));
  let poolList = [...Array(numRewardPools).keys()];
  let pendingBeets = 0;
  
  // User Info Multicall Query:
  let calls: CallContext[] = [];
  poolList.forEach(poolID => {
    calls.push({ reference: poolID.toString(), methodName: 'userInfo', methodParameters: [poolID, wallet] });
  });
  let multicallResults = await multicallOneContractQuery(chain, masterChef, beethovenx.masterChefABI, calls);
  let promises = poolList.map(poolID => (async () => {
    let userInfoResults = multicallResults[poolID];
    if(userInfoResults) {
      let balance = parseBN(userInfoResults[0]);
      if(balance > 0) {
        let poolAddress: Address = await query(chain, masterChef, beethovenx.masterChefABI, 'lpTokens', [poolID]);
        if(poolAddress != fBeetAddress) {
          let newToken = await addBalancerLikeToken(chain, project, 'staked', poolAddress, balance, wallet, vault);
          balances.push(newToken);
        }
        let poolBeets = parseInt(await query(chain, masterChef, beethovenx.masterChefABI, 'pendingBeets', [poolID, wallet]));
        if(poolBeets > 0) {
          pendingBeets += poolBeets;
        }
      }
    }
  })());
  await Promise.all(promises);
  if(pendingBeets > 0) {
    let beets = await addToken(chain, project, 'unclaimed', beetsToken, pendingBeets, wallet);
    balances.push(beets);
  }
  return balances;
}