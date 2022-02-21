import { BigInt, Address } from '@graphprotocol/graph-ts'
import {
  ExchangeActivated,
  ExchangeAllowedSwapperChanged,
  ExchangeCreated,
  ExchangeDeactivated,
  ExchangeMintStateChanged,
  ExchangeRateChanged,
  Swapped,
  PublishMarketFeeChanged
} from '../@types/templates/FixedRateExchange/FixedRateExchange'
import {
  FixedRateExchange,
  FixedRateExchangeSwap,
  FixedRateExchangeUpdate
} from '../@types/schema'
import {
  getFixedRateExchange,
  getUpdateOrSwapId,
  getFixedRateGraphID,
  updateFixedRateExchangeSupply
} from './utils/fixedRateUtils'
import { weiToDecimal } from './utils/generic'
import { addFixedRateExchange, addFixedSwap } from './utils/globalUtils'
import { getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

export function handleExchangeCreated(event: ExchangeCreated): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = new FixedRateExchange(fixedRateId)
  const user = getUser(event.params.exchangeOwner.toHexString())
  fixedRateExchange.owner = user.id
  fixedRateExchange.contract = event.address.toHexString()
  fixedRateExchange.exchangeId = event.params.exchangeId.toHexString()
  fixedRateExchange.datatoken = getToken(event.params.datatoken, true).id
  fixedRateExchange.baseToken = getToken(event.params.baseToken, false).id

  fixedRateExchange.active = false
  fixedRateExchange.price = weiToDecimal(
    event.params.fixedRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  fixedRateExchange.createdTimestamp = event.block.timestamp.toI32()
  fixedRateExchange.tx = event.transaction.hash.toHex()
  fixedRateExchange.block = event.block.number.toI32()
  fixedRateExchange.save()

  addFixedRateExchange()
  updateFixedRateExchangeSupply(event.params.exchangeId, event.address)
}

export function handleRateChange(event: ExchangeRateChanged): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )

  const fixedRateExchange = getFixedRateExchange(fixedRateId)
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(event.transaction.hash.toHex(), fixedRateId)
  )
  newExchangeUpdate.oldPrice = fixedRateExchange.price
  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash.toHex()
  newExchangeUpdate.block = event.block.number.toI32()

  fixedRateExchange.price = weiToDecimal(
    event.params.newRate.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )
  newExchangeUpdate.newPrice = fixedRateExchange.price

  newExchangeUpdate.save()
  fixedRateExchange.save()
}

export function handleMintStateChanged(event: ExchangeMintStateChanged): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = getFixedRateExchange(fixedRateId)
  fixedRateExchange.withMint = event.params.withMint
  fixedRateExchange.save()
}

// TODO: implement fre updates/history for changes

export function handleActivated(event: ExchangeActivated): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = getFixedRateExchange(fixedRateId)
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(event.transaction.hash.toHex(), fixedRateId)
  )
  newExchangeUpdate.oldActive = fixedRateExchange.active
  newExchangeUpdate.newActive = true
  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash.toHex()
  newExchangeUpdate.block = event.block.number.toI32()

  fixedRateExchange.active = true

  newExchangeUpdate.save()
  fixedRateExchange.save()
}

export function handleDeactivated(event: ExchangeDeactivated): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = getFixedRateExchange(fixedRateId)
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(event.transaction.hash.toHex(), fixedRateId)
  )
  newExchangeUpdate.oldActive = fixedRateExchange.active
  newExchangeUpdate.newActive = false

  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash.toHex()
  newExchangeUpdate.block = event.block.number.toI32()

  fixedRateExchange.active = false
  newExchangeUpdate.save()
  fixedRateExchange.save()
}

export function handleAllowedSwapperChanged(
  event: ExchangeAllowedSwapperChanged
): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = getFixedRateExchange(fixedRateId)
  const newExchangeUpdate = new FixedRateExchangeUpdate(
    getUpdateOrSwapId(event.transaction.hash.toHex(), fixedRateId)
  )

  newExchangeUpdate.createdTimestamp = event.block.timestamp.toI32()
  newExchangeUpdate.tx = event.transaction.hash.toHex()
  newExchangeUpdate.block = event.block.number.toI32()
  newExchangeUpdate.oldAllowedSwapper = fixedRateExchange.allowedSwapper

  fixedRateExchange.allowedSwapper = event.params.allowedSwapper.toHex()
  newExchangeUpdate.newAllowedSwapper = fixedRateExchange.allowedSwapper
  newExchangeUpdate.save()
  fixedRateExchange.save()
}

// TODO: implement market fee, opf fee
export function handleSwap(event: Swapped): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = getFixedRateExchange(fixedRateId)

  const swap = new FixedRateExchangeSwap(
    getUpdateOrSwapId(event.transaction.hash.toHex(), fixedRateId)
  )
  swap.createdTimestamp = event.block.timestamp.toI32()
  swap.tx = event.transaction.hash.toHex()
  swap.block = event.block.number.toI32()

  swap.exchangeId = fixedRateId
  swap.by = getUser(event.params.by.toHex()).id

  // we need to fetch the decimals of the base token
  const baseToken = getToken(
    Address.fromString(fixedRateExchange.baseToken),
    false
  )
  swap.baseTokenAmount = weiToDecimal(
    event.params.baseTokenSwappedAmount.toBigDecimal(),
    BigInt.fromI32(baseToken.decimals).toI32()
  )
  swap.dataTokenAmount = weiToDecimal(
    event.params.datatokenSwappedAmount.toBigDecimal(),
    BigInt.fromI32(18).toI32()
  )

  swap.save()
  updateFixedRateExchangeSupply(event.params.exchangeId, event.address)
  if (event.params.tokenOutAddress.toHexString() == fixedRateExchange.datatoken)
    addFixedSwap(
      event.params.tokenOutAddress.toHexString(),
      swap.dataTokenAmount
    )
  else
    addFixedSwap(
      event.params.tokenOutAddress.toHexString(),
      swap.baseTokenAmount
    )
}

export function handlePublishMarketFeeChanged(
  event: PublishMarketFeeChanged
): void {
  const fixedRateId = getFixedRateGraphID(
    event.params.exchangeId.toHexString(),
    event.address
  )
  const fixedRateExchange = getFixedRateExchange(fixedRateId)
  if (fixedRateExchange) {
    fixedRateExchange.publishMarketFeeAddress =
      event.params.newMarketCollector.toHexString()
    fixedRateExchange.publishMarketSwapFee = weiToDecimal(
      event.params.swapFee.toBigDecimal(),
      BigInt.fromI32(18).toI32()
    )
    fixedRateExchange.save()
  }
}
