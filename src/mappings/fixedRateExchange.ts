import { BigInt } from '@graphprotocol/graph-ts'
import {
  ExchangeActivated,
  ExchangeAllowedSwapperChanged,
  ExchangeCreated,
  ExchangeDeactivated,
  ExchangeMintStateChanged,
  ExchangeRateChanged,
  Swapped
} from '../@types/FixedRateExchange/FixedRateExchange'
import {
  FixedRateExchange,
  FixedRateExchangeSwap,
  FixedRateExchangeUpdate
} from '../@types/schema'
import { getFixedRateExchange, getUpdateOrSwapId } from './utils/fixedRateUtils'
import { tokenToDecimal } from './utils/generic'
import { getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

export function handleExchangeCreated(event: ExchangeCreated): void {
  const fixedRateExchange = new FixedRateExchange(
    event.params.exchangeId.toHexString()
  )
  const user = getUser(event.params.exchangeOwner.toHexString())
  fixedRateExchange.owner = user.id
  fixedRateExchange.datatoken = event.params.dataToken.toHexString()
  fixedRateExchange.baseToken = event.params.baseToken.toHexString()
  // fixedRateExchange.baseTokenSymbol = getTokenSymbol(event.params.baseToken)
  fixedRateExchange.active = false

  fixedRateExchange.price = tokenToDecimal(
    event.params.fixedRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  fixedRateExchange.save()
}

export function handleRateChange(event: ExchangeRateChanged): void {
  const fixedRateExchange = getFixedRateExchange(
    event.params.exchangeId.toHex()
  )
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(
      event.transaction.hash.toHex(),
      event.params.exchangeId.toHex()
    )
  )
  newExchangeUpdate.oldPrice = fixedRateExchange.price
  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash
  newExchangeUpdate.block = event.block.number.toI32()

  fixedRateExchange.price = tokenToDecimal(
    event.params.newRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  newExchangeUpdate.newPrice = fixedRateExchange.price

  newExchangeUpdate.save()
  fixedRateExchange.save()
}

export function handleMintStateChanged(event: ExchangeMintStateChanged): void {
  const fixedRateExchange = getFixedRateExchange(
    event.params.exchangeId.toHex()
  )
  fixedRateExchange.withMint = event.params.withMint
  fixedRateExchange.save()
}

// TODO: implement fre updates/history for changes

export function handleActivated(event: ExchangeActivated): void {
  const fixedRateExchange = getFixedRateExchange(
    event.params.exchangeId.toHex()
  )
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(
      event.transaction.hash.toHex(),
      event.params.exchangeId.toHex()
    )
  )
  newExchangeUpdate.oldActive = fixedRateExchange.active
  newExchangeUpdate.newActive = true
  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash
  newExchangeUpdate.block = event.block.number.toI32()

  fixedRateExchange.active = true

  newExchangeUpdate.save()
  fixedRateExchange.save()
}

export function handleDeactivated(event: ExchangeDeactivated): void {
  const fixedRateExchange = getFixedRateExchange(
    event.params.exchangeId.toHex()
  )
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(
      event.transaction.hash.toHex(),
      event.params.exchangeId.toHex()
    )
  )
  newExchangeUpdate.oldActive = fixedRateExchange.active
  newExchangeUpdate.newActive = false
  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash
  newExchangeUpdate.block = event.block.number.toI32()

  fixedRateExchange.active = false
  newExchangeUpdate.save()
  fixedRateExchange.save()
}

export function handleAllowedSwapperChanged(
  event: ExchangeAllowedSwapperChanged
): void {
  const fixedRateExchange = getFixedRateExchange(
    event.params.exchangeId.toHex()
  )
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(
      event.transaction.hash.toHex(),
      event.params.exchangeId.toHex()
    )
  )

  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash
  newExchangeUpdate.block = event.block.number.toI32()
  newExchangeUpdate.oldAllowedSwapper = fixedRateExchange.allowedSwapper

  fixedRateExchange.allowedSwapper = event.params.allowedSwapper.toHex()
  newExchangeUpdate.newAllowedSwapper = fixedRateExchange.allowedSwapper
  newExchangeUpdate.save()
  fixedRateExchange.save()
}

// TODO: implement market fee, opf fee
export function handleSwap(event: Swapped): void {
  const fixedRateExchange = getFixedRateExchange(
    event.params.exchangeId.toHex()
  )

  // reduce supply if the fixed rate is not minting tokens
  if (fixedRateExchange.isMinter || fixedRateExchange.withMint) {
    fixedRateExchange.supply = fixedRateExchange.supply.minus(
      event.params.dataTokenSwappedAmount
    )
  }

  const swap = new FixedRateExchangeSwap(
    getUpdateOrSwapId(
      event.transaction.hash.toHex(),
      event.params.exchangeId.toHex()
    )
  )
  swap.createdTimestamp = event.block.timestamp.toI32()
  swap.tx = event.transaction.hash
  swap.block = event.block.number.toI32()

  swap.exchangeId = event.params.exchangeId.toHex()
  swap.by = getUser(event.params.by.toHex()).id

  // we need to fetch the decimals of the base token
  const baseToken = getToken(fixedRateExchange.baseToken)
  swap.baseTokenAmount = tokenToDecimal(
    event.params.baseTokenSwappedAmount.toBigDecimal(),
    BigInt.fromI32(baseToken.decimals).toI32()
  )
  swap.dataTokenAmount = tokenToDecimal(
    event.params.dataTokenSwappedAmount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )

  swap.save()
}
