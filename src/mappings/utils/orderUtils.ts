import { Order } from '../../@types/schema'
import { ethereum } from '@graphprotocol/graph-ts'

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
  while (true) {
    console.log('first event index: ', firstEventIndex)
    const orderId = getOrderId(
      event.transaction.hash.toHex(),
      event.address.toHex(),
      event.transaction.from.toHex(),
      firstEventIndex.toString()
    )
    console.log('orderId: ', orderId)
    const order = Order.load(orderId)
    console.log('order datatoken: ', order.datatoken)
    console.log('event address: ', event.address.toString())
    if (order !== null && order.datatoken === event.address.toString()) {
      return order
    }
    firstEventIndex--
  }
}
