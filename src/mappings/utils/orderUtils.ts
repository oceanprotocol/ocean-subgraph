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
  for (let i = eventIndex - 1; i >= 0; i--) {
    const orderId = getOrderId(transactionHash, address, transactionFrom, i)
    log.info('trying with this orderId: {}', [orderId])
    const order = Order.load(orderId)
    if (order && order.datatoken == address) {
      log.info('found order datatoken: {} and event address: {}', [
        order.datatoken,
        address
      ])
      return order
    }
  }
  // return an Order just for compilation schema
  let tempEventIndex = eventIndex - 1
  log.info('return the default order: {}', [tempEventIndex.toString()])
  if (tempEventIndex < 0) {
    tempEventIndex = eventIndex
  }
  return getOrder(transactionHash, address, transactionFrom, tempEventIndex)
}

export function searchOrderReusedForEvent(
  transactionHash: string,
  eventAddress: string,
  eventIndex: number
): OrderReuse {
  for (let i = eventIndex - 1; i >= 0; i--) {
    const orderReused = OrderReuse.load(`${transactionHash}-${i}`)
    if (!orderReused) {
      continue
    }
    log.info('found reused order: {} ', [orderReused.id])
    const order = Order.load(orderReused.order)
    if (order && order.datatoken == eventAddress) {
      log.info('found order: {} ', [order.id])
      log.info('found reused order datatoken: {} and event address: {}', [
        order.datatoken,
        eventAddress
      ])
      return orderReused
    }
  }
  // return an OrderReuse just for compilation schema
  return new OrderReuse(`${transactionHash}-${eventIndex}`)
}
