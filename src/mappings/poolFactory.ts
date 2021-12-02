import { Pool } from '../@types/schema'
import { BPoolCreated } from '../@types/templates/BFactory/BFactory'
import { getToken } from './utils/tokenUtils'

export function handleNewPool(event: BPoolCreated): void {
  const pool = new Pool(event.params.newBPoolAddress.toHex())

  const baseToken = getToken(event.params.basetokenAddress.toHex())
  pool.baseToken = baseToken.id

  const datatoken = getToken(event.params.datatokenAddress.toHex())
  pool.datatoken = datatoken.id

  pool.owner = event.params.registeredBy.toHex()

  pool.createdTimestamp = event.block.timestamp.toI32()
  pool.tx = event.transaction.hash.toHex()
  pool.block = event.block.number.toI32()

  pool.save()
}
