import { NewPool } from '../@types/ERC20Template/ERC20Template'
import { Pool } from '../@types/schema'

export function handleNewPool(event: NewPool): void {
  const newPool = new Pool(event.params.poolAddress.toHex())

  newPool.createdTimestamp = event.block.timestamp.toI32()
  newPool.tx = event.transaction.hash
  newPool.block = event.block.number.toI32()
  newPool.save()
}
