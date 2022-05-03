
// Imports:
import { minABI, beethovenx } from '../../ABIs';
import { query, multicallQuery, addBalancerLikeToken, addToken, parseBN } from '../../functions';
import type { ContractCallContext } from 'ethereum-multicall';
import type { Chain, Address, Hash, Token, LPToken } from '../../types';

// Initializations:
const chain: Chain = 'ftm';
const project = 'beethovenx';
const masterChef: Address = '0x8166994d9ebBe5829EC86Bd81258149B87faCfd3';
const vault: Address = '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce';
const beetsToken: Address = '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e';
const fBeetAddress: Address = '0xfcef8a994209d6916EB2C86cDD2AFD60Aa6F54b1';
const poolIDs: Hash[] = [
  "0x0073ab9f483b1d8fc1495cd2c0cd61eb456d0b8a000200000000000000000317",
  "0x0202975fec570d4bebc5a3fbea5aa8013a24a39c000100000000000000000309",
  "0x03465acfd0bba1bb0b8e59431c4d58304e00d6070001000000000000000002f6",
  "0x034903fde8e94b4666bb1e018758123ddfbbcea5000100000000000000000292",
  "0x03c6b3f09d2504606936b1a4decefad204687890000200000000000000000015",
  "0x0459a6e0478644a87ee1371ecf944f403ac65522000200000000000000000222",
  "0x0a42326c6ee024f314c7e8dc5e8bd4af194d548f0002000000000000000001a8",
  "0x0d344d2dec87bdb1aaa9cc989b4866a67b2a851f0001000000000000000001ba",
  "0x1577eb091d3933a89be62130484e090bb8bd0e5800010000000000000000020f",
  "0x175511eed1a2bcb68e4e87820b903b0797ab9dbf00020000000000000000025c",
  "0x1b1d74a1ab76338653e3aaae79634d6a153d6514000100000000000000000225",
  "0x1f7b903571370fed9fc95b1a9862d78a2127b30e000100000000000000000117",
  "0x20544612a03e52d992a11792c1142b5857e3eff7000100000000000000000104",
  "0x20bc78a63a70e2af5a8298b39fd4f841ee295ef40001000000000000000002d4",
  "0x22b30b00e6796daf710fbe5cafbfc9cdd1377f2a000200000000000000000001",
  "0x27db386491ed1bf2af61ac398a83835e2a35f7200001000000000000000002cd",
  "0x2975035545008935152fdf48ca13406cc5d4e47500010000000000000000002a",
  "0x2ba4953c75860e70cd70f15a2d5fe07de832bcd1000200000000000000000210",
  "0x2bea17ede5d83ad19ae112b8592aadaa2b015de7000100000000000000000069",
  "0x2c580c6f08044d6dfaca8976a66c8fadddbd9901000000000000000000000038",
  "0x2cea0da40cf133721377bb2b0bf4adc43715bfc30002000000000000000001e1",
  "0x2ed55f12e700cde978e1f0491d681919814ca44b000200000000000000000021",
  "0x30a92a4eeca857445f41e4bb836e64d66920f1c0000200000000000000000071",
  "0x389b4e90205ad6a89e19fbb532d2a3323837000c000200000000000000000240",
  "0x3bd4c3d1f6f40d77b2e9d0007d6f76e4f183a46d0002000000000000000002d7",
  "0x41870439b607a29293d48f7c9da10e67142176240001000000000000000000a4",
  "0x431179854dcd5ff1f2beddc84dfe6422c5faa78600020000000000000000017c",
  "0x43d668c6f709c9d7f05c9404707a10d968b0348c00020000000000000000020b",
  "0x4885b55e41fb34196235685780a07085a7ac11fa00010000000000000000029b",
  "0x4a6dd05b3ef98f32641882a1af5dda62161f709e000100000000000000000245",
  "0x4e4e5a60c73dfedd86b0206d7c6d44cba8d55b27000200000000000000000106",
  "0x4ff9d9f23ba96e4b6ceb0a14b56c5e0500d18ff900010000000000000000031c",
  "0x53d56bb671ba55b77ce3a7d2e4b0230e187045ae0001000000000000000002d1",
  "0x55abbcb4a6b2ed72f42415758450a5549b78f95500010000000000000000010a",
  "0x56897add6dc6abccf0ada1eb83d936818bc6ca4d0002000000000000000002e8",
  "0x5bb2dee206c2bcc5768b9b2865ea971bd9c0ff19000200000000000000000219",
  "0x5e02ab5699549675a6d3beeb92a62782712d0509000200000000000000000138",
  "0x5e65474c8400d0bb76edbbe066b2d2e7b0b6e7fb00010000000000000000007c",
  "0x5ecf67abfb080379da0a9aefa18b04b2352f61be0002000000000000000002bf",
  "0x632f7f043b75c7137c3c7ecbb9d8172c692c998f00010000000000000000025b",
  "0x63386ef152e1ddef96c065636d6cc0165ff332910002000000000000000000a1",
  "0x644dd9c08e1848cae0ddf892686a642acefc9ccf0002000000000000000002d0",
  "0x64b301e21d640f9bef90458b0987d81fb4cf1b9e00020000000000000000022e",
  "0x64ddbd6c6ad58e79f0d8ce4dcd0cf3c82167eee40001000000000000000002a9",
  "0x65bf2d53bd1d7050d22873f6b9bb59edb0ca0b2000010000000000000000006e",
  "0x67f40ef38ed3a4d30b1f1d527d4d05ea0195a188000100000000000000000131",
  "0x6cf1b74a1c3d4016143f28992ef236aa5c2e0cdd000100000000000000000192",
  "0x6d12d3fe16dd83115254a32b273b05ac5444c349000100000000000000000029",
  "0x6d414c77ecef1ff33d6423baf21dea3ae381766e000200000000000000000224",
  "0x6fdc8415b654b0f60475944a0b9421dc36ee1363000100000000000000000000",
  "0x7010030d6db6b748a8db068c7012525ad9a4cad100010000000000000000010d",
  "0x709024ced2f087d8e658ad8cc928246671169ef90002000000000000000002ad",
  "0x70ea0dd6fe9016f2e46d17fa3cb709062574d69f000200000000000000000303",
  "0x713ee620a7702b79ea5413096a90702244fe4532000100000000000000000105",
  "0x71d159ee565912009c80d1df2053921c6a5e77320002000000000000000001f4",
  "0x72c0eb973dc95e2d185563f58fc26626cc2e8034000100000000000000000011",
  "0x75a1f077bc0b9b0e58e750e7e77e4433bab30aa40002000000000000000002e5",
  "0x7ae6a223cde3a17e0b95626ef71a2db5f03f540a00020000000000000000008a",
  "0x7ca132d9e8c420b84578a6618f10b2354551305800010000000000000000002b",
  "0x7d52245d6923a245ccdda1c27b8b309c32caf04400010000000000000000024b",
  "0x8437aca2c2fe814ded80302fe8eb60b5353ec3f7000100000000000000000217",
  "0x84cbc248b318e23c63586d7f70e451f0c13b96d10001000000000000000001da",
  "0x851553fd9bcd28befe450d3cfbb3f86f13832a1d000200000000000000000211",
  "0x85d9b554528da0c3641c1ba92f658a011f126523000100000000000000000308",
  "0x8935989412b74cbae41b406bb319d66d5b35d46100020000000000000000016f",
  "0x8b858eaf095a7337de6f9bc212993338773ca34e00020000000000000000023c",
  "0x8bb1839393359895836688165f7c5878f8c81c5e0002000000000000000000e1",
  "0x8c3c964c2d08679d3d09866cf62c5b14a5346479000100000000000000000207",
  "0x8dbb92ca6c399792ac07510a0996c59902cd75a1000200000000000000000299",
  "0x8e1e0e35cf1cc91d96f7eddc705991d5d29ed86f0001000000000000000001e5",
  "0x8e82e904dd9cb298d324c2c27929ca473d3e9bb000010000000000000000024f",
  "0x8f6a658056378558ff88265f7c9444a0fb4db4be0002000000000000000002b8",
  "0x8fdd16a23aebe95b928f1863760618e9ec29e72d000100000000000000000166",
  "0x8fe1a318e67bc203180adf68007613546e8af393000000000000000000000046",
  "0x9524f3a1c02176ebd36bdb445912afd67fce4e40000100000000000000000319",
  "0x979a066ca6e6ecb3fe9f48d713004deadf25d73b0001000000000000000002f1",
  "0x985976228a4685ac4ecb0cfdbeed72154659b6d900020000000000000000008d",
  "0x98676c6be8d6bbc2b7ccb8cbf9110ed13eccdee60002000000000000000002c0",
  "0x9a5cba29f557629e915ff109b4945e66e38e87ef00010000000000000000023f",
  "0x9af1f0e9ac9c844a4a4439d446c14378071830750001000000000000000000da",
  "0xa07de66aef84e2c01d88a48d57d1463377ee602b000200000000000000000002",
  "0xa0d24f37607f4da14d74ff42d46e093f42888c890001000000000000000001dd",
  "0xa1c5698a042638b6220e336ed9cfafb499560c200002000000000000000001b6",
  "0xa216aa5d67ef95dde66246829c5103c7843d1aab000100000000000000000112",
  "0xa27b83406e627d6ed2422979d704f7de5ccbf57b00010000000000000000015a",
  "0xa396b308b3366eb2e4c0a0cd30657a72a4b2812e000200000000000000000231",
  "0xa6534f59d0f875bea636a987968b378bb5f5a3e90001000000000000000001e8",
  "0xa6cf803866312dbb462b46ef3ec10df619c05147000200000000000000000264",
  "0xa77597f1b75ea285b3be5a07d9cc53ef388cea4f00020000000000000000030d",
  "0xa7d0a9923f9dad318c1141a12ceefb2d9c6eedf7000100000000000000000293",
  "0xa85ccae7948ff87e2e90e5a0a37c40daa7bb9278000100000000000000000316",
  "0xab7f6edb5405324d77a1b7a2802903f6f0e0f09200010000000000000000013d",
  "0xafe001c7cbb82d8d593963d8e9e63a1250c68806000100000000000000000242",
  "0xb1590f7c53ca796b5af215465832c43ea03f45950001000000000000000001a5",
  "0xb45669432de2b94680392ce4f2f8cbaae5908b7600010000000000000000016e",
  "0xb59244b5c76224c54373dde3e62301cf4f91895a0001000000000000000001e0",
  "0xb8121da4bdc666b7fad4db5a5c8b5cf9884d058e0001000000000000000001ac",
  "0xbb4607bede4610e80d35c15692efcb7807a2d0a6000200000000000000000140",
  "0xc042ef6ca08576bdfb57d3055a7654344fd153e400010000000000000000003a",
  "0xc14e339d66f3ddba733254f14e7f744e7d29cc8f000200000000000000000123",
  "0xc4dac57a46a0a1acd0eb95eddef5257926279960000200000000000000000150",
  "0xc7f084bcb91f779617b41602f85102849098d6a2000200000000000000000023",
  "0xc87b89d7ddd517056e623adaf080a1dfb465e4c4000100000000000000000149",
  "0xc98e9c812f5137667058978650d563a5d7f7a642000100000000000000000220",
  "0xc9ba718a71bfa34cedea910ac37b879e5913c14e0002000000000000000001ad",
  "0xcc31cd8293fa9da71670b08d80871a3d4f785e0f0001000000000000000002c5",
  "0xcca3a9f9e91a9f630b84e1df2fedcfe98fd800c90001000000000000000000fe",
  "0xccf8c0c978d3c36dce62799742272ba05edc6c1a000100000000000000000268",
  "0xcd83cd3650b320a5104d56a8a22c32c7671f82cd000100000000000000000127",
  "0xcde5a11a4acb4ee4c805352cec57e236bdbc3837000200000000000000000019",
  "0xcdf68a4d525ba2e90fe959c74330430a5a6b8226000200000000000000000008",
  "0xcf9d4940fe4c194c83d4d3b1de4c2dff4233f612000200000000000000000253",
  "0xd0003b4dd0336d82e6e0843532bb0918794a6f0d0001000000000000000000e8",
  "0xd163415bd34ef06f57c58d2aed5a5478afb464cc00000000000000000000000e",
  "0xd47d2791d3b46f9452709fa41855a045304d6f9d000100000000000000000004",
  "0xd57cda2caebb9b64bb88905c4de0f0da217a77d7000100000000000000000073",
  "0xd7b06ac72606f194aa0f09508530b6f45bf11e340002000000000000000002a8",
  "0xe03c7544e2b7c243e0711ab52a737e4e1a8a4bba000100000000000000000147",
  "0xe1b6b8cb5cb2f0e3ec504b909dc2579f201c956400020000000000000000031f",
  "0xe402555efa3b232ee8bc4c79a446b47b38b93ebf00010000000000000000007e",
  "0xecaa1cbd28459d34b766f9195413cb20122fb942000200000000000000000120",
  "0xf0e2c47d4c9fbbbc2f2e19acdaa3c773a3ecd22100010000000000000000000a",
  "0xf2b2103e1351c4d47b27efc8100bb264364fa92c00020000000000000000025a",
  "0xf361e16f3df7f176c8a223cb9f1b81ef86f118d50001000000000000000000fd",
  "0xf3a602d30dcb723a74a0198313a7551feaca7dac00010000000000000000005f",
  "0xf3f0970bca8ce7e9672d17a301b54d1485d938070000000000000000000000c8",
  "0xf54591700ac66a0c921cf5856e6c7019aebc87f90001000000000000000002a7",
  "0xf5c690b7af4fdc551ec89acbad91c6d646762a93000100000000000000000116",
  "0xf7bf0f161d3240488807ffa23894452246049916000200000000000000000198",
  "0xf8adb589cd7c2972761edc0b7d6d9ba6fe47723b00010000000000000000030a",
  "0xf8e4e42643e8fdf48fbf8d10071a07305eaacf990002000000000000000002eb",
  "0xf8fa40d35a3271ee5747fadc63634fa67359065100010000000000000000031e",
  "0xfa901cadcaf38cd533e8b1f693d090fc7005658e000100000000000000000165",
  "0xfc092f85125907ffcb0f9012e6e40b3f37c4de60000100000000000000000044",
  "0xfed8ddc3339b13c9e7670057dd5e13edc4fb747c0001000000000000000002db"
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

  // Pool Address Multicall Query Setup:
  let poolQueries: ContractCallContext[] = [];
  let poolQuery: ContractCallContext = {
    reference: 'poolAddresses',
    contractAddress: vault,
    abi: beethovenx.vaultABI,
    calls: []
  }
  poolIDs.forEach(id => {
    poolQuery.calls.push({ reference: id, methodName: 'getPool', methodParameters: [id] });
  });
  poolQueries.push(poolQuery);
  
  // Pool Address Multicall Query Results:
  let poolMulticallResults = (await multicallQuery(chain, poolQueries)).results;
  
  // Balance Multicall Query Setup:
  let balanceQueries: ContractCallContext[] = [];
  poolMulticallResults['poolAddresses'].callsReturnContext.forEach(result => {
    if(result.success) {
      let poolAddress = result.returnValues[0] as Address;
      balanceQueries.push({
        reference: result.reference,
        contractAddress: poolAddress,
        abi: minABI,
        calls: [{ reference: 'balance', methodName: 'balanceOf', methodParameters: [wallet] }]
      });
    }
  });

  // Balance Multicall Query Results:
  let balanceMulticallResults = (await multicallQuery(chain, balanceQueries)).results;
  let promises = Object.keys(balanceMulticallResults).map(result => (async () => {
    let balanceResult = balanceMulticallResults[result].callsReturnContext[0];
    if(balanceResult.success) {
      let poolID = balanceMulticallResults[result].originalContractCallContext.reference as Address;
      let poolAddress = balanceMulticallResults[result].originalContractCallContext.contractAddress as Address;
      let balance = parseBN(balanceResult.returnValues[0]);
      if(balance > 0) {
        let newToken = await addBalancerLikeToken(chain, project, 'liquidity', poolAddress, balance, wallet, poolID, vault);
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
  let pools = [...Array(numRewardPools).keys()];
  let pendingBeets = 0;
  
  // Multicall Query Setup:
  let queries: ContractCallContext[] = [];
  let balanceQuery: ContractCallContext = {
    reference: 'userInfo',
    contractAddress: masterChef,
    abi: beethovenx.masterChefABI,
    calls: []
  }
  pools.forEach(poolNum => {
    balanceQuery.calls.push({ reference: poolNum.toString(), methodName: 'userInfo', methodParameters: [poolNum, wallet] });
  });
  queries.push(balanceQuery);

  // Multicall Query Results:
  let multicallResults = (await multicallQuery(chain, queries)).results;
  let promises = multicallResults['userInfo'].callsReturnContext.map(result => (async () => {
    if(result.success) {
      let poolNum = parseInt(result.reference);
      let balance = parseBN(result.returnValues[0]);
      if(balance > 0) {
        let poolAddress: Address = await query(chain, masterChef, beethovenx.masterChefABI, 'lpTokens', [poolNum]);
        if(poolAddress != fBeetAddress) {
          let poolID: Address = await query(chain, poolAddress, beethovenx.poolABI, 'getPoolId', []);
          let newToken = await addBalancerLikeToken(chain, project, 'staked', poolAddress, balance, wallet, poolID, vault);
          balances.push(newToken);
        }
        let poolBeets = parseInt(await query(chain, masterChef, beethovenx.masterChefABI, 'pendingBeets', [poolNum, wallet]));
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