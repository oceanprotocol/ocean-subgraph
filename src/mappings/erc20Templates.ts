import { Order, Nft, OrderReuse } from '../@types/schema'
import { BigInt, BigDecimal, Address, log } from '@graphprotocol/graph-ts'

import {
  NewPaymentCollector,
  OrderStarted,
  PublishMarketFee,
  PublishMarketFeeChanged,
  ConsumeMarketFee,
  AddedMinter,
  AddedPaymentManager,
  RemovedMinter,
  RemovedPaymentManager,
  CleanedPermissions,
  OrderReused,
  ProviderFee
} from '../@types/templates/ERC20Template/ERC20Template'

import { integer } from './utils/constants'
import { weiToDecimal } from './utils/generic'
import { addOrder } from './utils/globalUtils'
import { getToken, getUSDValue } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'
import {
  getOrderId,
  searchOrderForEvent,
  searchOrderReusedForEvent
} from './utils/orderUtils'

const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000"

export function handleOrderStarted(event: OrderStarted): void {
  log.info("handleOrderStarted", [])
  const order = new Order(
    getOrderId(
      event.transaction.hash.toHex(),
      event.address.toHex(),
      event.transaction.from.toHex(),
      event.logIndex.toI32()
    )
  )
  log.info("Created order object", [])
  const token = getToken(event.address, true)
  log.info("Got the token", [])
  order.datatoken = token.id
  token.orderCount = token.orderCount.plus(integer.ONE)
  log.info("set data token and order count", [])

  const consumer = getUser(event.params.consumer.toHex())
  order.consumer = consumer.id
  log.info("got consumer id", [])

  if (token.nft) {
    const nft = Nft.load(token.nft as string) as Nft
    if (nft) {
      log.info("nft loaded and set", [])
      const nftOwner = getUser(nft.owner)
      order.nftOwner = nftOwner.id
    } else {
      log.info("nft couldnt load", [])
      order.nftOwner = ADDRESS_ZERO
    }
  } else {
    log.info("nft not found", [])
  }

  const payer = getUser(event.params.payer.toHex())
  payer.totalOrders = payer.totalOrders.plus(integer.ONE)
  payer.save()
  log.info("payer saved", [])
  order.payer = payer.id

  order.amount = weiToDecimal(
    event.params.amount.toBigDecimal(),
    token.decimals
  )
  log.info("set order amount", [])

  order.serviceIndex = event.params.serviceIndex.toI32()
  log.info("set order service index", [])

  const publishMarket = getUser(event.params.publishMarketAddress.toHex())
  order.publishingMarket = publishMarket.id
  log.info("set order publish market", [])

  order.createdTimestamp = event.block.timestamp.toI32()
  order.tx = event.transaction.hash.toHex()
  order.eventIndex = event.logIndex.toI32()
  order.block = event.block.number.toI32()
  log.info("set created ts tx eventindex and block", [])
  const tokenId = token.lastPriceToken
  log.info("got token id", [])
  if (tokenId) {
    log.info("token id setting", [])
    const priceToken = getToken(Address.fromString(tokenId), false)
    order.lastPriceToken = priceToken.id
    order.lastPriceValue = token.lastPriceValue
    order.estimatedUSDValue = getUSDValue(
      priceToken.id,
      order.lastPriceValue,
      order.createdTimestamp
    )
    log.info("token id is set", [])
  }

  if (event.receipt !== null && event.receipt!.gasUsed) {
    order.gasUsed = event.receipt!.gasUsed.toBigDecimal()
    log.info("LOG1", [])
} else {
    order.gasUsed = BigDecimal.zero()
    log.info("LOG2", [])
}
  if (event.transaction.gasPrice) {
    order.gasPrice = event.transaction.gasPrice
    log.info("LOG3", [])
} else {
    order.gasPrice = BigInt.zero()
    log.info("LOG4", [])
}
  log.info("order save start", [])
  order.save()
  token.save()
  addOrder()
  log.info("order save done", [])
  if (token.nft) {
    const nft = Nft.load(token.nft as string) as Nft
    if (nft) {
      nft.orderCount = nft.orderCount.plus(integer.ONE)
      nft.save()
    }
    const owner = getUser(nft.owner)
    owner.totalSales = owner.totalSales.plus(integer.ONE)
    owner.save()
    log.info("owner data updated", [])
  }
}

export function handlerOrderReused(event: OrderReused): void {
  const order = searchOrderForEvent(
    event.params.orderTxId.toHexString(),
    event.address.toHex(),
    event.params.caller.toHex(),
    event.logIndex.toI32()
  )

  if (!order) return
  const eventIndex: number = event.logIndex.toI32()

  const reuseOrder = new OrderReuse(
    `${event.transaction.hash.toHex()}-${eventIndex}`
  )
  if (event.transaction.gasPrice)
    reuseOrder.gasPrice = event.transaction.gasPrice
  else reuseOrder.gasPrice = BigInt.zero()
  if (event.receipt !== null && event.receipt!.gasUsed) {
    reuseOrder.gasUsed = event.receipt!.gasUsed.toBigDecimal()
  } else reuseOrder.gasUsed = BigDecimal.zero()
  reuseOrder.order = order.id
  reuseOrder.caller = event.params.caller.toHexString()
  reuseOrder.createdTimestamp = event.params.timestamp.toI32()
  reuseOrder.tx = event.transaction.hash.toHex()
  reuseOrder.eventIndex = event.logIndex.toI32()
  reuseOrder.block = event.params.number.toI32()

  reuseOrder.save()
}

export function handlePublishMarketFee(event: PublishMarketFee): void {
  const order = searchOrderForEvent(
    event.transaction.hash.toHex(),
    event.address.toHex(),
    event.transaction.from.toHex(),
    event.logIndex.toI32()
  )

  if (!order) return
  const publishMarket = getUser(event.params.PublishMarketFeeAddress.toHex())
  order.publishingMarket = publishMarket.id

  const publishMarketToken = getToken(event.params.PublishMarketFeeToken, true)
  order.publishingMarketToken = publishMarketToken.id
  order.publishingMarketAmmount = weiToDecimal(
    event.params.PublishMarketFeeAmount.toBigDecimal(),
    publishMarketToken.decimals
  )

  order.save()
}
export function handlePublishMarketFeeChanged(
  event: PublishMarketFeeChanged
): void {
  const token = getToken(event.address, true)
  if (!token) return

  token.publishMarketFeeAddress =
    event.params.PublishMarketFeeAddress.toHexString()
  token.publishMarketFeeToken = event.params.PublishMarketFeeToken.toHexString()
  let decimals = BigInt.fromI32(18).toI32()
  if (
    token.publishMarketFeeToken != '0x0000000000000000000000000000000000000000'
  ) {
    const token = getToken(event.params.PublishMarketFeeToken, false)
    decimals = BigInt.fromI32(token.decimals).toI32()
  }
  token.publishMarketFeeAmount = weiToDecimal(
    event.params.PublishMarketFeeAmount.toBigDecimal(),
    decimals
  )
  token.eventIndex = event.logIndex.toI32()
  token.save()
  // TODO - shold we have a history
}

export function handleConsumeMarketFee(event: ConsumeMarketFee): void {
  const order = searchOrderForEvent(
    event.transaction.hash.toHex(),
    event.address.toHex(),
    event.transaction.from.toHex(),
    event.logIndex.toI32()
  )

  if (!order) return
  const consumeMarket = getUser(event.params.consumeMarketFeeAddress.toHex())
  order.consumerMarket = consumeMarket.id

  const consumeMarketToken = getToken(event.params.consumeMarketFeeToken, false)
  order.consumerMarketToken = consumeMarketToken.id
  order.consumerMarketAmmount = weiToDecimal(
    event.params.consumeMarketFeeAmount.toBigDecimal(),
    consumeMarketToken.decimals
  )

  order.save()
}

// roles
// roles
export function handleAddedMinter(event: AddedMinter): void {
  const token = getToken(event.address, true)
  let existingRoles: string[]
  if (!token.minter) existingRoles = []
  else existingRoles = token.minter as string[]
  if (!existingRoles.includes(event.params.user.toHexString()))
    existingRoles.push(event.params.user.toHexString())
  token.minter = existingRoles
  token.eventIndex = event.logIndex.toI32()
  token.save()
}

export function handleRemovedMinter(event: RemovedMinter): void {
  const token = getToken(event.address, true)
  const newList: string[] = []
  let existingRoles: string[]
  if (!token.minter) existingRoles = []
  else existingRoles = token.minter as string[]
  if (!existingRoles || existingRoles.length < 1) return
  while (existingRoles.length > 0) {
    const role = existingRoles.shift().toString()
    if (!role) break
    if (role !== event.params.user.toHexString()) newList.push(role)
  }
  token.minter = newList
  token.eventIndex = event.logIndex.toI32()
  token.save()
}

export function handleAddedPaymentManager(event: AddedPaymentManager): void {
  const token = getToken(event.address, true)
  let existingRoles: string[]
  if (!token.paymentManager) existingRoles = []
  else existingRoles = token.paymentManager as string[]
  if (!existingRoles.includes(event.params.user.toHexString()))
    existingRoles.push(event.params.user.toHexString())
  token.paymentManager = existingRoles
  token.eventIndex = event.logIndex.toI32()
  token.save()
}
export function handleRemovedPaymentManager(
  event: RemovedPaymentManager
): void {
  const token = getToken(event.address, true)
  const newList: string[] = []
  let existingRoles: string[]
  if (!token.paymentManager) existingRoles = []
  else existingRoles = token.paymentManager as string[]
  if (!existingRoles || existingRoles.length < 1) return
  while (existingRoles.length > 0) {
    const role = existingRoles.shift().toString()
    if (!role) break
    if (role !== event.params.user.toHexString()) newList.push(role)
  }
  token.paymentManager = newList
  token.eventIndex = event.logIndex.toI32()
  token.save()
}
export function handleCleanedPermissions(event: CleanedPermissions): void {
  const token = getToken(event.address, true)
  const newList: string[] = []
  token.paymentManager = newList
  token.minter = newList
  const nft = Nft.load(token.nft as string)
  if (nft) token.paymentCollector = nft.owner
  else token.paymentCollector = '0x0000000000000000000000000000000000000000'
  token.eventIndex = event.logIndex.toI32()
  token.save()
}

export function handleNewPaymentCollector(event: NewPaymentCollector): void {
  const token = getToken(event.address, true)
  token.paymentCollector = event.params._newPaymentCollector.toHexString()
  token.eventIndex = event.logIndex.toI32()
  token.save()
}

export function handleProviderFee(event: ProviderFee): void {
  const providerFee: string = `{"providerFeeAddress": "${event.params.providerFeeAddress.toHex()}", "providerFeeToken": "${event.params.providerFeeToken.toHex()}", "providerFeeAmount": "${
    event.params.providerFeeAmount
  }", "providerData": "${event.params.providerData.toHexString()}", "v": "${
    event.params.v
  }", "r": "${event.params.r.toHexString()}", "s": "${event.params.s.toHexString()}", "validUntil": "${
    event.params.validUntil
  }"}`

  const order = searchOrderForEvent(
    event.transaction.hash.toHex(),
    event.address.toHex(),
    event.transaction.from.toHex(),
    event.logIndex.toI32()
  )

  if (order) {
    order.providerFee = providerFee
    order.providerFeeValidUntil = event.params.validUntil
    order.save()
    return
  }
  const orderReuse = searchOrderReusedForEvent(
    event.transaction.hash.toHex(),
    event.address.toHex(),
    event.logIndex.toI32()
  )
  if (orderReuse) {
    log.info('order reuse id in provider fee handler: {}', [orderReuse.id], [])
    orderReuse.providerFee = providerFee
    orderReuse.providerFeeValidUntil = event.params.validUntil
    orderReuse.save()
  }
}
