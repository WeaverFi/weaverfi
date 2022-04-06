![WeaverFi Logo][logo]
# WeaverFi SDK

The NPM package to query DeFi.

![CodeQL](https://github.com/CookieTrack-io/weaverfi/actions/workflows/codeql-analysis.yml/badge.svg)
![Version](https://img.shields.io/github/package-json/v/CookieTrack-io/weaverfi)

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

![Twitter Shield](https://img.shields.io/twitter/follow/cookietrack_io?style=social)

---

## Usage

Install the package using the following:

```
npm i weaverfi
```

Importing the package can be done through any one of the following methods, depending on your app's setup:

```
import weaver from 'weaverfi'
import { WeaverFi } from 'weaverfi'
const weaver = require('weaverfi').default
```

The `WeaverFi` object (or `weaver` if you prefer to import it that way) contains some global methods such as `WeaverFi.getAllProjects()`, `WeaverFi.getAllTokens()` or `WeaverFi.getAllTokenPrices()`.

Each supported chain has its own methods that can be used as `WeaverFi.ETH.getWalletBalance(wallet)`, for example.

---

## Global Methods Available

- `getAllProjects()`
- `getAllTokens()`
- `getAllTokenPrices()`
- `getNativeTokenPrices()`
- `fetchPrices()`
- `resolveENS(ensDomain)`
- `lookupENS(address)`
- `resolveTNS(tnsDomain)`
- `lookupTNS(address)`

## Chain Methods Available

- `query(address, abi, method, args)`
- `isWallet(address)`
- `getWalletBalance(wallet)`
- `getProjectBalance(wallet, project)`
- `getTokens()`
- `getTokenLogo(symbol)`
- `getProjects()`
- `getTokenPrices()`
- `getTokenPrice(address)`

## Chains Supported

- ETH (Ethereum)
- BSC (Binance Smart Chain)
- POLY (Polygon)
- FTM (Fantom)
- AVAX (Avalanche)
- ONE (Harmony)
- TERRA (Terra)

---

## Contributing

Contribution guidelines can be found [here](CONTRIBUTING.md).

[logo]: https://github.com/CookieTrack-io/weaverfi/blob/master/favicon.svg "WeaverFi"
