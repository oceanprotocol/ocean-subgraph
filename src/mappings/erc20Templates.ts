import { Order, Nft, OrderReuse } from '../@types/schema'
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'

import {
  NewPaymentCollector,
  OrderStarted,
  PublishMarketFee,
  PublishMarketFeeChanged,
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
import { getOrderId } from './utils/orderUtils'

export function handleOrderStarted(event: OrderStarted): void {
  const order = new Order(
    getOrderId(
      event.transaction.hash.toHex(),
      event.address.toHex(),
      event.transaction.from.toHex()
    )
  )

  const token = getToken(event.address, true)
  order.datatoken = token.id
  token.orderCount = token.orderCount.plus(integer.ONE)

  const consumer = getUser(event.params.consumer.toHex())
  order.consumer = consumer.id

  if (token.nft) {
    const nft = Nft.load(token.nft as string) as Nft
    const nftOwner = getUser(nft.owner)
    order.nftOwner = nftOwner.id
  }

  const payer = getUser(event.params.payer.toHex())
  payer.totalOrders = payer.totalOrders.plus(integer.ONE)
  payer.save()
  order.payer = payer.id

  order.amount = weiToDecimal(
    event.params.amount.toBigDecimal(),
    token.decimals
  )

  order.serviceIndex = event.params.serviceIndex.toI32()

  const publishMarket = getUser(event.params.publishMarketAddress.toHex())
  order.publishingMarket = publishMarket.id

  // const consumeMarket = getUser(event.params..toHex())
  // order.consumerMarket = consumeMarket.id

  order.createdTimestamp = event.block.timestamp.toI32()
  order.tx = event.transaction.hash.toHex()
  order.block = event.block.number.toI32()
  const tokenId = token.lastPriceToken
  if (tokenId) {
    const priceToken = getToken(Address.fromString(tokenId), false)
    order.lastPriceToken = priceToken.id
    order.lastPriceValue = token.lastPriceValue
    order.estimatedUSDValue = getUSDValue(
      priceToken.id,
      order.lastPriceValue,
      order.createdTimestamp
    )
  }

  if (event.receipt !== null && event.receipt!.gasUsed) {
    order.gasUsed = event.receipt!.gasUsed.toBigDecimal()
  } else {
    order.gasUsed = BigDecimal.zero()
  }
  if (event.transaction.gasPrice) {
    order.gasPrice = event.transaction.gasPrice
  } else {
    order.gasPrice = BigInt.zero()
  }
  order.save()
  token.save()
  addOrder()
  if (token.nft) {
    const nft = Nft.load(token.nft as string) as Nft
    if (nft) {
      nft.orderCount = nft.orderCount.plus(integer.ONE)
      nft.save()
    }
    const owner = getUser(nft.owner)
    owner.totalSales = owner.totalSales.plus(integer.ONE)
    owner.save()
  }
}

export function handlerOrderReused(event: OrderReused): void {
  const orderId = getOrderId(
    event.params.orderTxId.toHexString(),
    event.address.toHex(),
    event.params.caller.toHex()
  )
  const order = Order.load(orderId)

  if (!order) return

  const reuseOrder = new OrderReuse(event.transaction.hash.toHex())
  if (event.transaction.gasPrice)
    reuseOrder.gasPrice = event.transaction.gasPrice
  else reuseOrder.gasPrice = BigInt.zero()
  if (event.receipt !== null && event.receipt!.gasUsed) {
    reuseOrder.gasUsed = event.receipt!.gasUsed.toBigDecimal()
  } else reuseOrder.gasUsed = BigDecimal.zero()
  reuseOrder.order = orderId
  reuseOrder.caller = event.params.caller.toHexString()
  reuseOrder.createdTimestamp = event.params.timestamp.toI32()
  reuseOrder.tx = event.transaction.hash.toHex()
  reuseOrder.block = event.params.number.toI32()

  reuseOrder.save()
}

export function handlePublishMarketFee(event: PublishMarketFee): void {}
export function handlePublishMarketFeeChanged(
  event: PublishMarketFeeChanged
): void {
  const token = getToken(event.address, true)
  if (!token) return

  token.publishMarketFeeAddress =
    event.params.PublishMarketFeeAddress.toHexString()
  token.publishMarketFeeToken = event.params.PublishMarketFeeToken.toHexString()
  let decimals = BigInt.fromI32(token.decimals).toI32()
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
  token.save()
  // TODO - shold we have a history
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
  token.save()
}

export function handleNewPaymentCollector(event: NewPaymentCollector): void {
  const token = getToken(event.address, true)
  token.paymentCollector = event.params._newPaymentCollector.toHexString()
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

  const orderId = getOrderId(
    event.transaction.hash.toHex(),
    event.address.toHex(),
    event.transaction.from.toHex()
  )
  const order = Order.load(orderId)

  if (order) {
    order.providerFee = providerFee
    order.providerFeeValidUntil = event.params.validUntil
    order.save()
    return
  }

  let orderReuse = OrderReuse.load(event.transaction.hash.toHex())
  if (orderReuse) {
    orderReuse.providerFee = providerFee
    orderReuse.providerFeeValidUntil = event.params.validUntil
    orderReuse.save()
  } else {
    orderReuse = new OrderReuse(event.transaction.hash.toHex())
    orderReuse.providerFee = providerFee
    orderReuse.providerFeeValidUntil = event.params.validUntil
    orderReuse.order = orderId
    orderReuse.createdTimestamp = event.block.timestamp.toI32()
    orderReuse.tx = event.transaction.hash.toHex()
    orderReuse.block = event.block.number.toI32()
    orderReuse.caller = event.transaction.from.toHex()
    if (event.transaction.gasPrice)
      orderReuse.gasPrice = event.transaction.gasPrice
    else orderReuse.gasPrice = BigInt.zero()
    if (event.receipt !== null && event.receipt!.gasUsed) {
      orderReuse.gasUsed = event.receipt!.gasUsed.toBigDecimal()
    } else orderReuse.gasUsed = BigDecimal.zero()
    orderReuse.save()
  }
}
