import { Order, OrderReuse } from '../../@types/schema'
import { log } from '@graphprotocol/graph-ts'

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

export function searchOrderForEvent(
  transactionHash: string,
  address: string,
  transactionFrom: string,
  eventIndex: number
): Order {
  let firstEventIndex = eventIndex - 1

  log.info('firstEventIndex on simple order: {}', [
    firstEventIndex.toString().replace('0.0', '0')
  ])
  while (firstEventIndex >= 0) {
    const orderId = getOrderId(
      transactionHash,
      address,
      transactionFrom,
      firstEventIndex.toString().replace('0.0', '0')
    )
    log.info('orderId as trial: {}', [orderId])
    const order = Order.load(orderId)
    if (order !== null && order.datatoken === address) {
      return order
    }
    firstEventIndex--
  }
  // return a default Order if it cannot find the right one
  return getOrder(
    transactionHash,
    address,
    transactionFrom,
    firstEventIndex.toString().replace('0.0', '0')
  )
}

export function searchOrderResusedForEvent(
  transactionHash: string,
  eventAddress: string,
  eventIndex: number
): OrderReuse {
  let firstEventIndex = eventIndex - 1
  log.info('firstEventIndex on simple order: {}', [firstEventIndex.toString()])
  while (firstEventIndex >= 0) {
    const orderReused = OrderReuse.load(
      `${transactionHash}-${firstEventIndex.toString()}`
    )
    const order = Order.load(orderReused.order)
    if (
      orderReused !== null &&
      order !== null &&
      order.datatoken === eventAddress
    ) {
      return orderReused
    }

    firstEventIndex--
  }
  // return a default Order if it cannot find the right one
  return new OrderReuse(`${transactionHash}-${firstEventIndex.toString()}`)
}
