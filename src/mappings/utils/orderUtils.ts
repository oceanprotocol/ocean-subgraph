import { Order, OrderReuse } from '../../@types/schema'
import { log } from '@graphprotocol/graph-ts'

export function getOrderId(
  tx: string,
  tokenAddress: string,
  fromAddress: string,
  eventIndex: number
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
  eventIndex: number
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
  while (firstEventIndex >= 0) {
    const orderId = getOrderId(
      transactionHash,
      address,
      transactionFrom,
      firstEventIndex
    )
    log.info('trying with this orderId: {}', [orderId])
    const order = Order.load(orderId)
    if (order !== null && order.datatoken == address) {
      log.info('found order datatoken: {} and event address: {}', [
        order.datatoken,
        address
      ])
      return order
    }
    firstEventIndex--
  }
  // return a default Order if it cannot find the right one
  return getOrder(transactionHash, address, transactionFrom, firstEventIndex)
}

export function searchOrderResusedForEvent(
  transactionHash: string,
  eventAddress: string,
  eventIndex: number
): OrderReuse {
  let firstEventIndex = eventIndex - 1
  while (firstEventIndex >= 0) {
    const orderReused = OrderReuse.load(`${transactionHash}-${firstEventIndex}`)

    if (orderReused !== null) {
      const order = Order.load(orderReused.order)
      if (order !== null && order.datatoken == eventAddress) {
        log.info('found reused order datatoken: {} and event address: {}', [
          order.datatoken,
          eventAddress
        ])
        return orderReused
      }
    }

    firstEventIndex--
  }
  // return a default OrderReuse if it cannot find the right one
  return new OrderReuse(`${transactionHash}-${firstEventIndex}`)
}
