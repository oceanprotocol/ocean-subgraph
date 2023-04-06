import { Order, OrderReuse } from '../../@types/schema'
import { ethereum, log } from '@graphprotocol/graph-ts'

export function getOrderId(
  tx: string,
  tokenAddress: string,
  fromAddress: string,
  eventIndex: string
): string {
  return `${tx}-${tokenAddress}-${fromAddress}-${eventIndex}`
}

export function createOrder(orderId: string): Order {
  const order = new Order(orderId)
  return order
}

export function getOrder(
  transactionHash: string,
  address: string,
  transactionFrom: string,
  eventIndex: string
): Order {
  const orderId = getOrderId(
    transactionHash,
    address,
    transactionFrom,
    eventIndex
  )
  let newOrder = Order.load(orderId)
  if (newOrder === null) {
    newOrder = createOrder(orderId)
  }
  return newOrder
}

export function searchOrderForEvent(event: ethereum.Event): Order {
  let firstEventIndex = event.logIndex.toI32() - 1
  log.info('firstEventIndex on simple order: ', [firstEventIndex.toString()])
  while (true) {
    const orderId = getOrderId(
      event.transaction.hash.toHex(),
      event.address.toHex(),
      event.transaction.from.toHex(),
      firstEventIndex.toString()
    )
    log.info('orderId as trial: ', [orderId])
    const order = Order.load(orderId)
    if (order !== null) {
      log.info('order datatoken: ', [order.datatoken])
    }
    log.info('event address: ', [event.address.toString()])
    if (order !== null && order.datatoken === event.address.toString()) {
      return order
    }
    firstEventIndex--
  }
}

export function searchOrderResusedForEvent(event: ethereum.Event): OrderReuse {
  let firstEventIndex = event.logIndex.toI32() - 1
  log.info('firstEventIndex on simple order: ', [firstEventIndex.toString()])
  while (true) {
    const orderReused = OrderReuse.load(
      `${event.transaction.hash.toHex()}-${firstEventIndex}`
    )

    if (orderReused !== null) {
      log.info('order reused order: ', [orderReused.order])
      const order = Order.load(orderReused.order)
      if (order !== null) {
        log.info('order datatoken: ', [order.datatoken])
      }
      log.info('event address: ', [event.address.toString()])

      if (
        orderReused !== null &&
        order !== null &&
        order.datatoken === event.address.toString()
      ) {
        return orderReused
      }
    }

    firstEventIndex--
  }
}
