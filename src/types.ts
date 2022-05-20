
// Chain Types:
export type Chain = 'eth' | 'bsc' | 'poly' | 'ftm' | 'avax' | 'one' | 'cronos' | 'op' | 'arb';
export type UpperCaseChain = 'ETH' | 'BSC' | 'POLY' | 'FTM' | 'AVAX' | 'ONE' | 'CRONOS' | 'OP' | 'ARB';
export type ChainID = 1 | 56 | 137 | 250 | 43114 | 1666600000 | 25 | 10 | 42161;

// Address Types:
export type Address = `0x${string}`;
export type ENSDomain = `${string}.eth`;

// Token Types:
export type TokenType = 'nativeToken' | 'token' | 'lpToken' | 'debt' | 'xToken' | 'nft';
export type TokenStatus = 'none' | 'staked' | 'liquidity' | 'lent' | 'borrowed' | 'unclaimed';

// Transaction Types:
export type TXType = 'transfer' | 'approve' | 'revoke';

// Price Source Types:
export type PriceSource = 'chain' | 'coingecko' | '1inch' | 'paraswap';

// NFT Data Query Types:
export type NFTDataQueryType = 'none' | 'indexed' | 'listed';

// Generic Types:
export type URL = `https://${string}`;
export type Hash = `0x${string}`;

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

// Transaction Interfaces:
export interface SimpleTX {
    wallet: Address
    chain: Chain
    hash: Hash
    block: number
    time: number
    direction: 'in' | 'out'
    fee: number
}
export interface DetailedTX extends SimpleTX {
    type: TXType
    token: TXToken
    nativeToken: string
}
export interface ApprovalTX extends DetailedTX {
    type: 'approve' | 'revoke'
}
export interface TransferTX extends DetailedTX {
    type: 'transfer'
    from: Address
    to: Address
    value: number
}
export interface TaxApprovalTX extends ApprovalTX {
    token: TXToken
    nativeTokenPrice: number
}
export interface TaxTransferTX extends TransferTX {
    token: TaxTXToken
    nativeTokenPrice: number
}
export interface TXToken {
    address: Address
    symbol: string
    logo: URL
}
export interface TaxTXToken extends TXToken {
    price: number
}

// Transaction Type Guards:
export function isApprovalTX(tx: DetailedTX): tx is ApprovalTX {
    return (tx.type === 'approve' || tx.type === 'revoke');
}
export function isTransferTX(tx: DetailedTX): tx is TransferTX {
    return tx.type === 'transfer';
}

/* ========================================================================================================================================================================= */

// ABI Interfaces:
export interface ABI {
    constant: true
    inputs: (ABIIO | ABITupleIO)[]
    name: string
    outputs: (ABIIO | ABITupleIO)[]
    type: 'function'
}
export interface ABIIO {
    name: string
    type: string
}
export interface ABITupleIO {
    type: 'tuple[]'
    components: ABIIO[]
}

/* ========================================================================================================================================================================= */

// Chain Data Interfaces:
export interface ChainData {
    id: ChainID
    token: string
    wrappedToken: Address
    usdc: Address
    usdcDecimals: number
    inch: boolean
    paraswap: boolean,
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
    chain: string
    status: 'active' | 'eol'
    platform: string
    token: string
    tokenAddress: Address
    earnedTokenAddress: Address
    assets: string[]
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