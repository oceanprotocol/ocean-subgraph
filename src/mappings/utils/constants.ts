import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ENABLE_DEBUG = true

export const DAY = 24 * 60 * 60

export namespace integer {
  export const NEGATIVE_ONE = BigInt.fromI32(-1)
  export const ZERO = BigInt.fromI32(0)
  export const ONE = BigInt.fromI32(1)
  export const TWO = BigInt.fromI32(2)
  export const ONE_BASE_18 = BigInt.fromI32(10).pow(18 as u8)
}

export namespace decimal {
  export const ZERO = BigDecimal.fromString('0.0')
  export const MINUS_1 = BigDecimal.fromString('-1.0')
  export const ONE = BigDecimal.fromString('1.0')
  export const BONE = BigDecimal.fromString('1000000000000000000')
}

export enum PoolTransactionType {
  JOIN = 'JOIN',
  EXIT = 'EXIT',
  SWAP = 'SWAP',
  SETUP = 'SETUP'
}

export enum NftUpdateType {
  METADATA_CREATED = 'METADATA_CREATED',
  METADATA_UPDATED = 'METADATA_UPDATED',
  STATE_UPDATED = 'STATE_UPDATED',
  TOKENURI_UPDATED = 'TOKENURI_UPDATED'
}
