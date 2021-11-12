import { BPoolCreated } from '../@types/FactoryRouter/FactoryRouter'
import { Pool } from '../@types/schema'
import { getPoolToken } from './utils/poolUtils'

export function handleNewPool(event: BPoolCreated): void {
  const pool = new Pool(event.params.newBPoolAddress.toHex())

  const baseToken = getPoolToken(
    event.params.newBPoolAddress.toHex(),
    event.params.basetokenAddress.toHex()
  )
  pool.baseToken = baseToken.id

  const datatoken = getPoolToken(
    event.params.newBPoolAddress.toHex(),
    event.params.datatokenAddress.toHex()
  )
  pool.datatoken = datatoken.id

  pool.owner = event.params.registeredBy.toHex()
  
  pool.createdTimestamp = event.block.timestamp.toI32()
  pool.tx = event.transaction.hash
  pool.block = event.block.number.toI32()

  pool.save()
}
