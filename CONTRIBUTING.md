# Contribution Guidelines

The `Issues` section of this repository can be sorted by items with the `Help Wanted` label.

Not a developer? Feel free to reach out to us on [Discord](https://discord.com/invite/DzADcq7y75) with feedback, suggestions, or make a [donation](#donations) to help fund development!

[<img width="150px" src="https://user-images.githubusercontent.com/3408362/174302052-6757cf66-f454-4298-b150-2df023ab69e8.png" />](https://discord.com/invite/DzADcq7y75)

## Suggesting Support for New Dapp

Want a new dapp to be supported by WeaverFi? Feel free to create a new issue here by going to `Issues`, `New Issue` and selecting the `New Project` template to make it easier for all involved to see what you are suggesting.

## Reporting Bugs

Found a bug? You can either choose to report it in our [Discord server](https://discord.com/invite/DzADcq7y75) in the #bug-reports channel, or by creating an issue in this repository. To do so, go to `Issues`, `New Issue`, and you'll see a `Bug Report` template you can use to facilitate your report.

## Donations

Support us on GitCoin [here](https://gitcoin.co/grants/5854/weaverfi-the-open-source-defi-portfolio-tracker)!

Donations can also be made to support the development of WeaverFi through the following wallet addresses:

**Ethereum:** ncookie.eth

**BSC/Polygon/Fantom/Avalanche/Cronos/Optimism/Arbitrum:** 0xbE4FeAE32210f682A41e1C41e3eaF4f8204cD29E

We plan to soon change our donation structure to allocate some of the funds towards hosting costs, and the rest distributed among contributors.

## Adding Support for New Dapp Yourself

Doing so was made as easy and straightforward as possible. Simply fork this repository and submit a pull request with the following changes:

- Any new relevant tracked tokens listed in `/src/tokens.ts`.
- Any new relevant new ABIs updated in `/src/ABIs.ts`.
- A file in `/src/projects/` with the functionality of querying the new dapp in the appropriate chain folder, as a `.ts` file.

The basic structure of any project's integration is an exported `get()` function that returns token balances. Here's a simple example from PoolTogether's Ethereum [integration]('https://github.com/WeaverFi/weaverfi/blob/main/src/projects/eth/pooltogether.ts'):

```ts
export const get = async (wallet: Address) => {
  let balance: Token[] = [];
  balance.push(...(await getPoolBalanceV4(wallet).catch((err) => { throw new WeaverError(chain, project, 'getPoolBalanceV4()', err) })));
  return balance;
}
```

The `getPoolBalanceV4()` function in this case is a function that would check a user's PoolTogether V4 balance on-chain, and return some `Token` objects. You can have many different functions to query many different aspects of any project! Keep in mind there are other ready objects for other token types such as `NativeToken`, `LPToken`, `DebtToken` or `XToken`.

Here's the aforementioned example function:

```ts
export const getPoolBalanceV4 = async (wallet: Address) => {
  let balance = parseInt(await query(chain, poolTicketV4, minABI, 'balanceOf', [wallet]));
  if(balance > 0) {
    let newToken = await addToken(chain, project, 'staked', usdc, balance, wallet, poolDepositV4);
    return [newToken];
  } else {
    return [];
  }
}
```

As this integration is quite simple, the `query()` function was used to make on-chain queries. If there are multiple on-chain queries to make, consider using `multicallQuery()`, `multicallOneMethodQuery()` or `multicallOneContractQuery()` to greatly speed up the efficiency of your integration.

The `addToken()` function was then used to create a `Token` object suitable to return as a result. Appropriately named methods are also available for other token types, such as `addNativeToken()`, `addLPToken()`, `addDebtToken()` and `addXToken()`.

You can also add any extra info you'd like to your token balances, since all token types have an optional `info` attribute to indicate values like `apr`, `apy`, `unlock`, `deprecated`, or any others you may think of.

There are tons of already present implementations of dapps in `/src/projects/`, use any relevant ones as a template for your new integration!

You can test your implementation through `npm run test`, and a lot of tests are already setup and available in `/src/tests.ts`. Make sure you run `npm run build` at least once to add your integration to the projects list!

If your PR isn't reviewed right away, reach out in our [Discord server](https://discord.com/invite/DzADcq7y75)!

## Tracking New Token

In order to track a new token, first ensure it has a price feed available either through CoinGecko, ParaSwap or 1Inch (not necessary for NFTs).

Simply add the token's information to `/src/tokens.ts` under its appropriate chain! Each addition follows the following structure:

```ts
{
  address: Address,
  symbol: string,
  logo: URL,
  decimals: number
}
```

Here's the USDC token on Ethereum, as an example:

```ts
{ address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', logo: 'https://etherscan.io/token/images/centre-usdc_28.png', decimals: 6 }
```

## Other Contributions

If you have in mind any other type of contribution, please reach out in our [Discord server](https://discord.com/invite/DzADcq7y75)!
