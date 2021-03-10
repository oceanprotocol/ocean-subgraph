import { BigInt } from '@graphprotocol/graph-ts'
import {
  ExchangeCreated,
  ExchangeActivated,
  ExchangeDeactivated,
  ExchangeRateChanged,
  Swapped
} from '../@types/FixedRateExchange/FixedRateExchange'

import {
  FixedRateExchange,
  FixedRateExchangeUpdate,
  FixedRateExchangeSwap
} from '../@types/schema'

import { tokenToDecimal } from '../helpers'

export function handleExchangeCreated(event: ExchangeCreated): void {
  const fixedrateexchange = new FixedRateExchange(
    event.params.exchangeId.toHexString()
  )
  fixedrateexchange.exchangeOwner = event.params.exchangeOwner.toHexString()
  fixedrateexchange.datatoken = event.params.dataToken.toHexString()
  fixedrateexchange.baseToken = event.params.baseToken.toHexString()
  fixedrateexchange.active = false
  fixedrateexchange.rate = tokenToDecimal(
    event.params.fixedRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  fixedrateexchange.save()
}

export function handleExchangeActivated(event: ExchangeActivated): void {
  const tx = event.transaction.hash
  const id = tx
    .toHexString()
    .concat('-')
    .concat(event.params.exchangeId.toHexString())
  const fixedrateexchange = FixedRateExchange.load(
    event.params.exchangeId.toHexString()
  )

  const freupdate = new FixedRateExchangeUpdate(id)
  freupdate.exchangeId = event.params.exchangeId.toHexString()
  freupdate.oldRate = fixedrateexchange.rate
  freupdate.newRate = fixedrateexchange.rate
  freupdate.oldActive = fixedrateexchange.active
  freupdate.newActive = true
  freupdate.block = event.block.number.toI32()
  freupdate.timestamp = event.block.timestamp.toI32()
  freupdate.tx = tx
  freupdate.save()

  fixedrateexchange.active = true
  fixedrateexchange.save()
}
export function handleExchangeDeactivated(event: ExchangeDeactivated): void {
  const tx = event.transaction.hash
  const id = tx
    .toHexString()
    .concat('-')
    .concat(event.params.exchangeId.toHexString())
  const fixedrateexchange = FixedRateExchange.load(
    event.params.exchangeId.toHexString()
  )

  const freupdate = new FixedRateExchangeUpdate(id)
  freupdate.exchangeId = event.params.exchangeId.toHexString()
  freupdate.oldRate = fixedrateexchange.rate
  freupdate.newRate = fixedrateexchange.rate
  freupdate.oldActive = fixedrateexchange.active
  freupdate.newActive = false
  freupdate.block = event.block.number.toI32()
  freupdate.timestamp = event.block.timestamp.toI32()
  freupdate.tx = tx
  freupdate.save()

  fixedrateexchange.active = false
  fixedrateexchange.save()
}
export function handleExchangeRateChanged(event: ExchangeRateChanged): void {
  const tx = event.transaction.hash
  const id = tx
    .toHexString()
    .concat('-')
    .concat(event.params.exchangeId.toHexString())
  const fixedrateexchange = FixedRateExchange.load(
    event.params.exchangeId.toHexString()
  )

  const freupdate = new FixedRateExchangeUpdate(id)
  freupdate.exchangeId = event.params.exchangeId.toHexString()
  freupdate.oldRate = fixedrateexchange.rate
  freupdate.newRate = tokenToDecimal(
    event.params.newRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  freupdate.oldActive = fixedrateexchange.active
  freupdate.newActive = fixedrateexchange.active
  freupdate.block = event.block.number.toI32()
  freupdate.timestamp = event.block.timestamp.toI32()
  freupdate.tx = tx
  freupdate.save()

  fixedrateexchange.rate = tokenToDecimal(
    event.params.newRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  fixedrateexchange.save()
}
export function handleSwapped(event: Swapped): void {
  const tx = event.transaction.hash
  const id = tx
    .toHexString()
    .concat('-')
    .concat(event.params.exchangeId.toHexString())
  const freSwap = new FixedRateExchangeSwap(id)
  freSwap.exchangeId = event.params.exchangeId.toHexString()
  freSwap.by = event.params.by.toHexString()
  freSwap.baseTokenAmount = tokenToDecimal(
    event.params.baseTokenSwappedAmount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  freSwap.dataTokenAmount = tokenToDecimal(
    event.params.dataTokenSwappedAmount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  freSwap.block = event.block.number.toI32()
  freSwap.timestamp = event.block.timestamp.toI32()
  freSwap.tx = tx
  freSwap.save()
}
