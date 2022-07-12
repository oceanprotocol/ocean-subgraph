import { Order } from '../../@types/schema'

export function getOrderId(
  tx: string,
  tokenAddress: string,
  fromAddress: string
): string {
  return `${tx}-${tokenAddress}-${fromAddress}`
}

export function createOrder(orderId: string): Order {
  const order = new Order(orderId)
  return order
}

export function getOrder(
  transactionHash: string,
  address: string,
  transactionFrom: string
): Order {
  const orderId = getOrderId(transactionHash, address, transactionFrom)
  let newOrder = Order.load(orderId)
  if (newOrder === null) {
    newOrder = createOrder(orderId)
  }
  return newOrder
}
