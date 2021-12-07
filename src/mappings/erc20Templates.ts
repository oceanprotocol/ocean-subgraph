import { Order } from '../@types/schema'
import { OrderStarted } from '../@types/templates/ERC20Template/ERC20Template'
import { integer } from './utils/constants'
import { weiToDecimal } from './utils/generic'
import { getGlobalStats } from './utils/globalUtils'
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
  order.token = token.id
  token.orderCount = token.orderCount.plus(integer.ONE)

  const consumer = getUser(event.params.consumer.toHex())
  order.consumer = consumer.id

  const payer = getUser(event.params.payer.toHex())
  order.payer = payer.id

  order.amount = weiToDecimal(
    event.params.amount.toBigDecimal(),
    token.decimals
  )

  order.serviceId = event.params.serviceId.toI32()

  const publishMarket = getUser(event.params.publishMarketAddress.toHex())
  order.publishingMarket = publishMarket.id

  const consumeMarket = getUser(event.params.consumeFeeMarketAddress.toHex())
  order.consumerMarket = consumeMarket.id

  order.createdTimestamp = event.block.timestamp.toI32()
  order.tx = event.transaction.hash.toHex()
  order.block = event.block.number.toI32()

  const globalStats = getGlobalStats()
  globalStats.orderCount = globalStats.orderCount.plus(integer.ONE)

  globalStats.save()
  order.save()
  token.save()
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
