import { Order, Nft } from '../@types/schema'
import { BigInt } from '@graphprotocol/graph-ts'
import {
  NewPaymentCollector,
  OrderStarted,
  PublishMarketFee,
  PublishMarketFeeChanged
} from '../@types/templates/ERC20Template/ERC20Template'

import { integer } from './utils/constants'
import { weiToDecimal } from './utils/generic'
import { addOrder } from './utils/globalUtils'
import { getToken } from './utils/tokenUtils'
import { getUser } from './utils/userUtils'

function getOrderId(
  tx: string,
  tokenAddress: string,
  fromAddress: string
): string {
  return `${tx}-${tokenAddress}-${fromAddress}`
}

export function handleOrderStarted(event: OrderStarted): void {
  const order = new Order(
    getOrderId(
      event.transaction.hash.toHex(),
      event.address.toHex(),
      event.transaction.from.toHex()
    )
  )

  const token = getToken(event.address.toHex())
  order.datatoken = token.id
  token.orderCount = token.orderCount.plus(integer.ONE)

  const consumer = getUser(event.params.consumer.toHex())
  order.consumer = consumer.id

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

export function handleNewPaymentCollector(event: NewPaymentCollector): void {}
export function handlePublishMarketFee(event: PublishMarketFee): void {}
export function handlePublishMarketFeeChanged(
  event: PublishMarketFeeChanged
): void {
  const token = getToken(event.address.toHex())
  if (token != null) {
    token.publishMarketFeeAddress =
      event.params.PublishMarketFeeAddress.toHexString()
    token.publishMarketFeeToken =
      event.params.PublishMarketFeeToken.toHexString()
    let decimals = BigInt.fromI32(18).toI32()
    if (
      token.publishMarketFeeToken !=
      '0x0000000000000000000000000000000000000000'
    ){
      const token = getToken(event.params.PublishMarketFeeToken.toHexString())
      decimals = BigInt.fromI32(token.decimals).toI32()
    }
    token.publishMarketFeeAmmount = weiToDecimal(
      event.params.PublishMarketFeeAmount.toBigDecimal(),
      decimals
    )
    token.save()
    // TODO - shold we have a history
  }
}
// export function handlePublishMarketFees(event: PublishMarketFees): void {
//   const order = Order.load(
//     getOrderId(
//       event.transaction.hash.toHex(),
//       event.address.toHex(),
//       event.transaction.from.toHex()
//     )
//   )

//   order.save()
// }

// export function handleConsumeMarketFees(event: ConsumeMarketFees): void {
//   const order = Order.load(
//     getOrderId(
//       event.transaction.hash.toHex(),
//       event.address.toHex(),
//       event.transaction.from.toHex()
//     )
//   )

//   order.save()
// }
