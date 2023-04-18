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
): Order | null {
  for (let i = eventIndex - 1; i >= 0; i--) {
    log.info('i for order started: {}', [i.toString()])
    const orderId = getOrderId(transactionHash, address, transactionFrom, i)
    log.info('trying with this orderId: {}', [orderId])
    const order = Order.load(orderId)
    log.info('loaded order with this orderId: {}', [orderId])
    if (order) {
      log.info('order with this orderId: {}', [order.id])
      log.info('found order datatoken: {} and event address: {}', [
        order.datatoken,
        address
      ])
    }
    if (order && order.datatoken == address) {
      log.info('found order datatoken: {} and event address: {}', [
        order.datatoken,
        address
      ])
      log.info('found order, exit searching: {}', [order.id])
      return order
    }
  }
  return null
}

export function searchOrderReusedForEvent(
  transactionHash: string,
  eventAddress: string,
  eventIndex: number
): OrderReuse | null {
  for (let i = eventIndex - 1; i >= 0; i--) {
    log.info('i in order reused: {}', [i.toString()])
    log.info('transactionHash in order reused: {}', [
      transactionHash.toString()
    ])
    const orderReused = OrderReuse.load(`${transactionHash}-${i}`)
    log.info('loaded order reused with this id: {}', [
      `${transactionHash}-${i}`
    ])
    if (!orderReused) {
      continue
    }
    log.info('found reused order: {} ', [orderReused.id])
    log.info('loaded reused order with this orderId: {}', [orderReused.order])
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
  return null
}
