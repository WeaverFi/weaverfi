
// Chain Types:
export type Chain = 'eth' | 'bsc' | 'poly' | 'ftm' | 'avax' | 'cronos' | 'op' | 'arb';
export type ChainID = 1 | 56 | 137 | 250 | 43114 | 25 | 10 | 42161;

// Address Types:
export type Address = `0x${string}`;
export type ENSDomain = `${string}.eth`;

// Token Types:
export type TokenType = 'nativeToken' | 'token' | 'lpToken' | 'debt' | 'xToken' | 'nft';
export type TokenStatus = 'none' | 'staked' | 'liquidity' | 'lent' | 'borrowed' | 'unclaimed';

// Price Source Types:
export type PriceSource = 'chain' | 'coingecko' | '1inch' | 'paraswap';

// NFT Data Query Types:
export type NFTDataQueryType = 'none' | 'indexed' | 'listed' | 'ens';

// ABI Types:
export type ABI = (ABIEntry | ExtendedABIEntry | ExtendedABIEventEntry | ExtendedABIConstructorEntry)[];
export type ABIIOType = `int${number}` | `int${number}[${number | ''}]` | `uint${number}` | `uint${number}[${number | ''}]` | `bytes${number | ''}` | `bytes${number | ''}[${number | ''}]` | 'address' | `address[${number | ''}]` | 'bool' | `bool[${number | ''}]` | 'tuple' | `tuple[${number | ''}]` | 'string' | `string[${number | ''}]` | `contract ${string}` | `struct ${string}`;

// Generic Types:
export type URL = `http${'s'|''}://${string}`;
export type Hash = `0x${string}`;
export type IPFS = `ipfs://${string}`;
export type IPNS = `ipns://${string}`;

/* ========================================================================================================================================================================= */

// Token Interfaces:
export interface BaseToken {
	symbol: string
	address: Address
	balance: number
}
export interface PricedToken extends BaseToken {
	price: number
	logo: URL
}
export interface OwnedToken extends BaseToken {
	type: TokenType
	chain: Chain
	location: string
	status: TokenStatus
	owner: Address
	contract?: Address
	info?: TokenInfo
}
export interface NativeToken extends OwnedToken, PricedToken {
	type: 'nativeToken'
}
export interface Token extends OwnedToken, PricedToken {
	type: 'token'
}
export interface LPToken extends OwnedToken {
	type: 'lpToken'
	token0: PricedToken
	token1: PricedToken
}
export interface DebtToken extends OwnedToken, PricedToken {
	type: 'debt'
}
export interface XToken extends OwnedToken {
	type: 'xToken'
	logo: URL
	underlyingToken: PricedToken
}
export interface TokenInfo {
	apr?: number
	apy?: number
	unlock?: number
	deprecated?: boolean
	relic?: RelicInfo
}
export interface RelicInfo {
	id?: number
	entry?: number
	poolId?: number
	level?: number
}
// Token Type Guards:
export function isNativeToken(token: OwnedToken): token is NativeToken {
	return token.type === 'nativeToken';
}
export function isToken(token: OwnedToken): token is Token {
	return token.type === 'token';
}
export function isLPToken(token: OwnedToken): token is LPToken {
	return token.type === 'lpToken';
}
export function isDebtToken(token: OwnedToken): token is DebtToken {
	return token.type === 'debt';
}
export function isXToken(token: OwnedToken): token is XToken {
	return token.type === 'xToken';
}

/* ========================================================================================================================================================================= */

// NFT Interface:
export interface NFT {
	type: TokenType
	chain: Chain
	location: string
	status: TokenStatus
	owner: Address
	name: string
	address: Address
	id?: number
	data?: string
}

/* ========================================================================================================================================================================= */

// ABI Interfaces:
export interface ABIEntry {
	constant: boolean
	inputs: (ABIIO | ABITupleIO)[]
	name: string
	outputs: (ABIIO | ABITupleIO)[]
	type: 'function'
}
export interface ABIIO {
	name: string
	type: ABIIOType
}
export interface ABITupleIO {
	type: 'tuple' | 'tuple[]'
	components: ABIIO[]
}
export interface ExtendedABIEntry {
	inputs: (ExtendedABIIO | ExtendedABITupleIO)[]
	name: string
	outputs: (ExtendedABIIO | ExtendedABITupleIO)[]
	stateMutability: 'view' | 'nonpayable' | 'payable' | 'pure'
	type: 'function'
}
export interface ExtendedABIEventEntry {
	anonymous: boolean
	inputs: (ExtendedABIIO | ExtendedABITupleIO)[]
	name: string
	type: 'event'
}
export interface ExtendedABIConstructorEntry {
	inputs: (ExtendedABIIO | ExtendedABITupleIO)[]
	stateMutability: 'view' | 'nonpayable' | 'payable' | 'pure'
	type: 'constructor'
}
export interface ExtendedABIIO extends ABIIO {
	indexed?: boolean
	internalType: ABIIOType
}
export interface ExtendedABITupleIO {
	type: 'tuple' | 'tuple[]'
	components: ExtendedABIIO[]
}

/* ========================================================================================================================================================================= */

// Chain Data Interfaces:
export interface ChainData {
	id: ChainID
	name: string
	token: string
	wrappedToken: Address
	usdc: Address
	usdcDecimals: number
	inch: boolean
	paraswap: boolean
	rpcs: URL[]
	coingeckoIDs: CoinGeckoIDs
	multicall: Address
}
export interface CoinGeckoIDs {
	chainID: string
	nativeTokenID: string
}

/* ========================================================================================================================================================================= */

// Chain Token Data Interfaces:
export interface ChainTokenData {
	tokens: TokenData[]
	logos: LogoData[]
	nfts: NFTData[]
}
export interface TokenData {
	address: Address
	symbol: string
	logo: URL
	decimals: number
}
export interface LogoData {
	symbol: string
	logo: URL
}
export interface NFTData {
	address: Address
	dataQuery: NFTDataQueryType
	name: string
}

/* ========================================================================================================================================================================= */

// Token Price Data Interface:
export interface TokenPriceData {
	symbol: string | null
	address: Address
	price: number
	source: PriceSource
	timestamp: number
}

/* ========================================================================================================================================================================= */

// Multicall Interface:
export interface CallContext {
	reference: string
	methodName: string
	methodParameters: any[]
}

/* ========================================================================================================================================================================= */

// Miscellaneous API Response Types:
export interface SnowballAPIResponse {
	symbol: string
	address: Address
	lpAddress: Address
	deprecated: boolean
	yearlyAPY: number
	yearlySwapFees: number
	gaugeInfo: {
		address: Address
		snobYearlyAPR: number
	}
}
export interface AaveAPIResponse {
	symbol: string
	isActive: boolean
	underlyingAsset: Address
	aTokenAddress: Address
	avg7DaysLiquidityRate: number
	borrowingEnabled: boolean
	variableDebtTokenAddress: Address
	avg7DaysVariableBorrowRate: number
	stableBorrowRateEnabled: boolean
	stableDebtTokenAddress: Address
	stableBorrowRate: number
}
export interface BeefyAPIResponse {
	id: string
	chain: 'ethereum' | 'bsc' | 'polygon' | 'fantom' | 'avax' | 'cronos' | 'optimism' | 'arbitrum'
	status: 'active' | 'eol'
	platformId: string
	token: string
	tokenDecimals: number
	tokenAddress: Address
	tokenProviderId: string
	earnedTokenAddress: Address
	assets: string[]
	pricePerFullShare: string
}
export interface YieldYakAPIResponse {
	apr: number | null
	apy: number | null
}
export interface MoonPotAPIResponse {
	status: 'active' | 'eol'
	token: string
	tokenAddress: Address
	contractAddress: Address
}