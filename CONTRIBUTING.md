# Contribution Guidelines

The `Issues` section of this repository can be sorted by items with the `Help Wanted` label.

Not a developer? Feel free to reach out to us on [Discord](https://discord.com/invite/DzADcq7y75) with feedback, suggestions, or make a [donation](#donations) to help fund development!

## Suggesting Support for New Dapp

Want a new dapp to be supported by WeaverFi? Feel free to create a new issue here by going to `Issues`, `New Issue` and selecting the `New Project` template to make it easier for all involved to see what you are suggesting.

## Reporting Bugs

Found a bug? You can either choose to report it in our [Discord server](https://discord.com/invite/DzADcq7y75) in the #bug-reports channel, or by creating an issue in this repository. To do so, go to `Issues`, `New Issue`, and you'll see a `Bug Report` template you can use to facilitate your report.

## Donations

Support us on GitCoin [here](https://gitcoin.co/grants/5854/weaverfi-the-open-source-defi-portfolio-tracker)!

Donations can also be made to support the development of WeaverFi through the following wallet addresses:

**Ethereum:** ncookie.eth

**BSC/Polygon/Fantom/Avalanche/Harmony/Cronos/Optimism/Arbitrum:** 0xbE4FeAE32210f682A41e1C41e3eaF4f8204cD29E

We plan to soon change our donation structure to allocate some of the funds towards hosting costs, and the rest distributed among contributors.

## Adding Support for New Dapp Yourself

Doing so was made as easy and straightforward as possible. Simply fork this repository and submit a pull request with the following changes:

- Any new relevant tracked tokens listed in `/src/tokens.ts`.
- Any new relevant new ABIs updated in `/src/ABIs.ts`.
- A file in `/src/projects/` with the functionality of querying the new dapp in the appropriate chain folder, as a `.ts` file.

There are tons of already present implementations of dapps in `/src/projects/`, use any relevant ones as a template for your new integration!

You can test your implementation through `npm run test`, and a lot of tests are already setup and available in `/src/tests.ts`.

If your PR isn't reviewed right away, reach out in our [Discord server](https://discord.com/invite/DzADcq7y75)!

## Tracking New Token

In order to track a new token, first ensure it has a price feed available either through CoinGecko, ParaSwap or 1Inch (not necessary for NFTs).

Simply add the token's information to `/src/tokens.ts` under its appropriate chain!

## Other Contributions

If you have in mind any other type of contribution, please reach out in our [Discord server](https://discord.com/invite/DzADcq7y75)!
