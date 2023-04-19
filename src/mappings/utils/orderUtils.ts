import { Order, OrderReuse } from '../../@types/schema'

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
  for (let i = eventIndex; i >= 0; i--) {
    const orderId = getOrderId(transactionHash, address, transactionFrom, i)
    const order = Order.load(orderId)
    if (order && order.datatoken == address) {
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
  for (let i = eventIndex; i >= 0; i--) {
    const orderReused = OrderReuse.load(`${transactionHash}-${i}`)
    if (!orderReused) {
      continue
    }
    const order = Order.load(orderReused.order)

    if (order && order.datatoken == eventAddress) {
      return orderReused
    }
  }
  return null
}
