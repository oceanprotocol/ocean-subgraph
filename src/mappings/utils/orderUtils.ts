import { Order } from '../../@types/schema'

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
