
// Chain Types:
export type Chain = 'eth' | 'bsc' | 'poly' | 'ftm' | 'avax' | 'one' | 'terra';
export type EVMChain = 'eth' | 'bsc' | 'poly' | 'ftm' | 'avax' | 'one';
export type ChainID = 1 | 56 | 137 | 250 | 43114 | 1666600000;

// Address Types:
export type Address = `0x${string}`;
export type TerraAddress = `terra1${string}`;
export type ENS = `${string}.eth`;

// Token Types:
export type TokenType = 'nativeToken' | 'token' | 'lpToken' | 'debt' | 'xToken';
export type TokenStatus = 'none' | 'staked' | 'liquidity' | 'lent' | 'borrowed' | 'unclaimed';

// Transaction Types:
export type TXType = 'transfer' | 'approve' | 'revoke';

// Price Source Types:
export type PriceSource = 'chain' | 'coingecko' | '1inch' | 'paraswap' | 'proxy';

// Terra Native Token Denoms:
export type TerraDenom = 'uluna' | 'uaud' | 'ucad' | 'uchf' | 'ucny' | 'udkk' | 'ueur' | 'ugbp' | 'uhkd' | 'uidr' | 'uinr' | 'ujpy' | 'ukrw' | 'umnt' | 'uphp' | 'usdr' | 'usek' | 'usgd' | 'uthb' | 'uusd' | 'umyr' | 'utwd';

// Generic Types:
export type URL = `https://${string}`;
export type Hash = `0x${string}`;

/* ========================================================================================================================================================================= */

// Token Interfaces:
export interface BaseToken {
    symbol: string
    address: Address | TerraAddress
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
    owner: Address | TerraAddress
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

// Transaction Interfaces:
export interface SimpleTX {
    wallet: Address
    chain: Chain
    hash: Hash
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
    contract: boolean
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
export interface Chains {
    eth: ChainData
    bsc: ChainData
    poly: ChainData
    ftm: ChainData
    avax: ChainData
    one: ChainData
    terra: TerraChainData
}
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
}
export interface TerraChainData {
    token: string
    rpcs: URL[]
    coingeckoIDs: CoinGeckoIDs
}
export interface CoinGeckoIDs {
    chainID: string
    nativeTokenID: string
}

/* ========================================================================================================================================================================= */

// Chain Token Data Interfaces:
export interface BaseChainTokenData {
    logos: LogoData[]
}
export interface ChainTokenData extends BaseChainTokenData {
    tokens: TokenData[]
    blacklist: Address[]
}
export interface TerraChainTokenData extends BaseChainTokenData {
    tokens: TerraTokenData[]
    blacklist: TerraAddress[]
}
export interface TokenData {
    address: Address
    symbol: string
    logo: URL
    decimals: number
}
export interface TerraTokenData {
    address: TerraAddress
    symbol: string
    logo: URL
    decimals: number
}
export interface LogoData {
    symbol: string
    logo: URL
}

/* ========================================================================================================================================================================= */

// Token Price Data Interface:
export interface TokenPriceData {
    symbol: string | null
    address: Address | TerraAddress
    price: number
    source: PriceSource
    timestamp: number
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