import { BigInt, ethereum, log } from '@graphprotocol/graph-ts'
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
  log.info("for new exchange {} for rate {}",[event.params.exchangeId.toHexString(),event.params.fixedRate.toString()])
  fixedrateexchange.rate = tokenToDecimal(
    event.params.fixedRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  fixedrateexchange.save()
}

function _processActiveUpdated(
  event: ethereum.Event,
  exchangeId: string,
  active: boolean
): void {
  const tx = event.transaction.hash
  const id = tx.toHexString().concat('-').concat(exchangeId)
  const fixedrateexchange = FixedRateExchange.load(exchangeId)

  const freupdate = new FixedRateExchangeUpdate(id)
  freupdate.exchangeId = exchangeId
  freupdate.oldRate = fixedrateexchange.rate
  freupdate.newRate = fixedrateexchange.rate
  freupdate.oldActive = fixedrateexchange.active
  freupdate.newActive = active
  freupdate.block = event.block.number.toI32()
  freupdate.timestamp = event.block.timestamp.toI32()
  freupdate.tx = tx
  freupdate.save()

  fixedrateexchange.active = active
  fixedrateexchange.save()
}

export function handleExchangeActivated(event: ExchangeActivated): void {
  _processActiveUpdated(event, event.params.exchangeId.toHexString(), true)
}

export function handleExchangeDeactivated(event: ExchangeDeactivated): void {
  _processActiveUpdated(event, event.params.exchangeId.toHexString(), false)
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
  if(!fixedrateexchange){
    log.error("Cannot update unknown FRE {}",[event.params.exchangeId.toHexString()])
    return
  }

  const freupdate = new FixedRateExchangeUpdate(id)
  freupdate.exchangeId = fixedrateexchange.id
  freupdate.oldRate = fixedrateexchange.rate
  log.info("for new exchange {} for rate {}",[id,event.params.newRate.toString()])
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

  fixedrateexchange.rate = freupdate.newRate
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
