# Contribution Guidelines

The easiest way to find ways to contribute to WeaverFi's development is to browse the following:

- The `Projects` section of this repository will have many issues listed as `To Do`.
- The `Issues` section of this repository can be sorted by items with the `Help Wanted` label.

## Suggesting Support for New Dapp

Want a new dapp to be supported by WeaverFi? Feel free to create a new issue here by going to `Issues`, `New Issue` and selecting the `New Project` template to make it easier for all involved to see what you are suggesting.

## Reporting Bugs

Found a bug? You can either choose to report it in our [Discord server](https://discord.com/invite/DzADcq7y75) in the #bug-reports channel, or by creating an issue in this repository. To do so, go to `Issues`, `New Issue`, and you'll see a `Bug Report` template you can use to facilitate your report.

## Adding Support for New Dapp Yourself

Doing so was made as easy and straightforward as possible. Simply fork this repository and submit a pull request with the following changes:

- Any new relevant tracked tokens listed in `/src/tokens.ts`.
- Any new relevant new ABIs updated in `/src/ABIs.ts`.
- A file in `/src/projects/` with the functionality of querying the new dapp in the appropriate chain folder, as a `.ts` file.
- The name of your project (the same as the file name) in `/src/projects.ts`.

There is a template at `/src/projects/template.ts` to help new contributors, and plenty of other dapp implementations to use as examples.

You can test your implementation through `npm run test`, and a lot of tests are already setup and available in `/src/tests.ts`.

If your PR isn't reviewed right away, reach out in our [Discord server](https://discord.com/invite/DzADcq7y75)!

## Tracking New Token

In order to track a new token, first ensure it has a price feed available either through CoinGecko, ParaSwap or 1Inch.

If so, simply add the token's information to `/src/tokens.ts`.

## Donations

Donations can be made to support the development of WeaverFi through the following wallet addresses:

**Ethereum:** ncookie.eth

**BSC/Polygon/Fantom/Avalanche/Harmony/Cronos:** 0xbE4FeAE32210f682A41e1C41e3eaF4f8204cD29E

We plan to soon change our donation structure to allocate some of the funds towards hosting costs, and the rest distributed among contributors.

## Other Contributions

If you have in mind any other type of contribution, please reach out in our [Discord server](https://discord.com/invite/DzADcq7y75)!
