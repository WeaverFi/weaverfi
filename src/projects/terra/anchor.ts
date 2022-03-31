
// Imports:
import { query, addNativeToken, addNativeDebtToken, addToken, addLPToken } from '../../terra-functions';
import type { Chain, TerraAddress, NativeToken, Token, LPToken, DebtToken } from '../../types';

// Initializations:
const chain: Chain = 'terra';
const project = 'anchor';
const aust: TerraAddress = 'terra1hzh9vpxhsk8253se0vv5jj6etdvxu3nv8z07zu';
const anc: TerraAddress = 'terra14z56l0fp2lsf86zy3hty2z47ezkhnthtr9yq76';
const market: TerraAddress = 'terra1sepfj7s0aeg5967uxnfk4thzlerrsktkpelm5s';
const gov: TerraAddress = 'terra1f32xyep306hhcxxxf7mlyh0ucggc00rm2s9da5';

// bLUNA Addresses:
const bLunaReward: TerraAddress = 'terra17yap3mhph35pcwvhza38c2lkj7gzywzy05h7l0';
const bLunaCustody: TerraAddress = 'terra1ptjp2vfjrwh0j0faj9r6katm640kgjxnwwq9kn';
const bLunaToken: TerraAddress = 'terra1kc87mu460fwkqte29rquh4hc20m54fxwtsx7gp';

// bETH Addresses:
const bEthReward: TerraAddress = 'terra1939tzfn4hn960ychpcsjshu8jds3zdwlp8jed9';
const bEthCustody: TerraAddress = 'terra10cxuzggyvvv44magvrh3thpdnk9cmlgk93gmx2';
const bEthToken: TerraAddress = 'terra1dzhzukyezv0etz22ud940z7adyv7xgcjkahuun';

// ANC-UST Addresses:
const ancUstLP: TerraAddress = 'terra1qr2k6yjjd5p2kaewqvg93ag74k6gyjr7re37fs';
const ancUstLPToken: TerraAddress = 'terra1wmaty65yt7mjw6fjfymkd9zsm6atsq82d9arcd';
const astroGenerator: TerraAddress = 'terra1zgrx9jjqrfye8swykfgmd6hpde60j0nszzupp9';

/* ========================================================================================================================================================================= */

// Function to get project balance:
export const get = async (wallet: TerraAddress) => {
  let balance: (NativeToken | Token | LPToken | DebtToken)[] = [];
  try {
    balance.push(...(await getEarnBalance(wallet)));
    balance.push(...(await getBAssetRewards(wallet)));
    balance.push(...(await getBorrowedTokens(wallet)));
    balance.push(...(await getAncGovTokens(wallet)));
    balance.push(...(await getStakedLP(wallet)));
  } catch {
    console.error(`Error fetching ${project} balances on ${chain.toUpperCase()}.`);
  }
  return balance;
}

/* ========================================================================================================================================================================= */

// Function to get Earn aUST balance:
const getEarnBalance = async (wallet: TerraAddress) => {
  let balance = parseInt((await query(aust, { balance: { address: wallet } })).balance);
  if(balance > 0) {
    let exchangeRate = (await query(market, {state: {}})).prev_exchange_rate;
    let newToken = await addNativeToken(project, 'staked', balance * exchangeRate, wallet, 'usd');
    return [newToken];
  } else {
    return [];
  }
}

// Function to get bLUNA and bETH rewards:
const getBAssetRewards = async (wallet: TerraAddress) => {
  let ustRewards = 0;
  ustRewards += parseInt((await query(bLunaReward, { accrued_rewards: { address: wallet } })).rewards);
  ustRewards += parseInt((await query(bEthReward, { accrued_rewards: { address: wallet } })).rewards);
  if(ustRewards > 0) {
    let newToken = await addNativeToken(project, 'unclaimed', ustRewards, wallet, 'usd');
    return [newToken];
  } else {
    return [];
  }
}

// Function to get borrowed token info:
const getBorrowedTokens = async (wallet: TerraAddress) => {
  let tokens: (NativeToken | Token | DebtToken)[] = [];
  let borrowerInfo = await query(market, { borrower_info: { borrower: wallet } });

  // Borrowed Tokens:
  let borrowedBalance = parseInt(borrowerInfo.loan_amount);
  if(borrowedBalance > 0) {
    tokens.push(await addNativeDebtToken(project, 'borrowed', borrowedBalance, wallet, 'usd'));
  }

  // Borrowing Rewards:
  let borrowRewards = parseInt(borrowerInfo.pending_rewards);
  if(borrowRewards > 0) {
    tokens.push(await addToken(project, 'unclaimed', anc, 'ANC', 6, borrowRewards, wallet));
  }

  // bLUNA Collateral:
  let collateralBLuna = parseInt((await query(bLunaCustody, { borrower: { address: wallet } })).balance);
  if(collateralBLuna > 0) {
    tokens.push(await addToken(project, 'lent', bLunaToken, 'bLUNA', 6, collateralBLuna, wallet));
  }

  // bETH Collateral:
  let collateralBEth = parseInt((await query(bEthCustody, { borrower: { address: wallet } })).balance);
  if(collateralBEth > 0) {
    tokens.push(await addToken(project, 'lent', bEthToken, 'bETH', 6, collateralBEth, wallet));
  }

  return tokens;
}

// Function to get staked ANC:
const getAncGovTokens = async (wallet: TerraAddress) => {
  let govAncBalance = parseInt((await query(gov, { staker: { address: wallet } })).balance);
  if(govAncBalance > 0) {
    let newToken = await addToken(project, 'staked', anc, 'ANC', 6, govAncBalance, wallet);
    return [newToken];
  } else {
    return [];
  }
}

// Function to get staked ANC-UST LP:
const getStakedLP = async (wallet: TerraAddress) => {
  let tokens: (Token | LPToken)[] = [];

  // LP Balance:
  let lpBalance = parseInt(await query(astroGenerator, { deposit: { lp_token: ancUstLPToken, user: wallet } }));
  if(lpBalance > 0) {
    tokens.push(await addLPToken(project, 'staked', ancUstLP, lpBalance, wallet));
  }

  // ANC Rewards:
  let rewardsBalance = parseInt((await query(astroGenerator, { pending_token: { lp_token: ancUstLPToken, user: wallet } })).pending_on_proxy);
  if(rewardsBalance > 0) {
    tokens.push(await addToken(project, 'unclaimed', anc, 'ANC', 6, rewardsBalance, wallet));
  }

  return tokens;
}