import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'

export const ENABLE_DEBUG = true
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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

// string enums don't work in wasm so this was the alternative, not optimal

export namespace NftUpdateType {
  export const METADATA_CREATED = 'METADATA_CREATED'
  export const METADATA_UPDATED = 'METADATA_UPDATED'
  export const STATE_UPDATED = 'STATE_UPDATED'
  export const TOKENURI_UPDATED = 'TOKENURI_UPDATED'
}
