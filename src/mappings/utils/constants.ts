import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ENABLE_DEBUG = true

export const enum PoolTransactionType {
  JOIN = 'join',
  EXIT = 'exit',
  SWAP = 'swap',
  SETUP = 'setup'
}

export namespace integer {
  export const NEGATIVE_ONE = BigInt.fromI32(-1)
  export const ZERO = BigInt.fromI32(0)
  export const ONE = BigInt.fromI32(1)
  export const TWO = BigInt.fromI32(2)
  export const ONE_BASE_18 = BigInt.fromI32(10).pow(18 as u8)
}

export namespace deciaml {
  export const ZERO_BD = BigDecimal.fromString('0.0')
  export const MINUS_1_BD = BigDecimal.fromString('-1.0')
  export const ONE_BD = BigDecimal.fromString('1.0')
  export const BONE = BigDecimal.fromString('1000000000000000000')
}
