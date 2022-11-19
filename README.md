![WeaverFi Banner][banner]

The NPM package to query DeFi.

![CodeQL](https://github.com/WeaverFi/weaverfi/actions/workflows/codeql-analysis.yml/badge.svg)
![Version](https://img.shields.io/github/package-json/v/WeaverFi/weaverfi)
![Downloads](https://img.shields.io/npm/dw/weaverfi)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

[<img src="https://img.shields.io/twitter/follow/weaver_fi?style=social" />](https://twitter.com/weaver_fi)

[<img width="150px" src="https://user-images.githubusercontent.com/3408362/174302052-6757cf66-f454-4298-b150-2df023ab69e8.png" />](https://discord.com/invite/DzADcq7y75)

## Contributing

Contribution guidelines can be found [here](CONTRIBUTING.md).

[banner]: /Banner.png "WeaverFi"

## Usage

Install the package using the following:

```
npm i weaverfi
```

Importing the package can be done through the following:

```ts
import weaver from 'weaverfi'
```

Other options to suit different app configurations:

```ts
import WeaverFi from 'weaverfi'
import { WeaverFi } from 'weaverfi'
const weaver = require('weaverfi').default
```

The `WeaverFi` object (or `weaver` if you prefer to import it that way) contains some global methods such as `WeaverFi.getAllProjects()`, `WeaverFi.getAllTokens()` or `WeaverFi.getAllTokenPrices()`.

Each supported chain has its own methods that can be used as `WeaverFi.eth.getWalletBalance(wallet)`, for example.

## Global Methods Available

- `getAllChains()`
- `getAllChainInfo()`
- `getAllProjects()`
- `getAllTokens()`
- `getAllTokenPrices()`
- `getNativeTokenPrices()`
- `checkPrices()`
- `getAllBalances(wallet)`

## Chain Methods Available

- `query(address, abi, method, args)`
- `queryBlocks(address, abi, event, querySize, args, options)`
- `isAddress(address)`
- `getTXCount(address)`
- `getWalletBalance(wallet)`
- `getProjectBalance(wallet, project)`
- `getAllProjectBalances(wallet)`
- `getNFTBalance(wallet)`
- `getTokens()`
- `getTokenLogo(symbol)`
- `getGasEstimates()`
- `getInfo()`
- `getProjects()`
- `getTokenPrices()`
- `getTokenPrice(address, decimals)`
- `updateTokenPrice(priceData)`
- `checkPrices()`
- `setCustomRpcEndpoints(rpcs)`
- `getProviders()`

The ETH chain also contains the `resolveENS(name)`, `lookupENS(address)` and `fetchAvatarENS(name)` methods.

## Chains Supported

- ETH (Ethereum)
- BSC (Binance Smart Chain)
- POLY (Polygon)
- FTM (Fantom)
- AVAX (Avalanche)
- CRONOS (Cronos)
- OP (Optimism)
- ARB (Arbitrum)

## Types

Any extra types used within the SDK are located in the `types.ts` file.

If needed, these can be imported from `weaverfi/dist/types`. Example:

```ts
import type { ChainID, Address, Token } from 'weaverfi/dist/types';
```
