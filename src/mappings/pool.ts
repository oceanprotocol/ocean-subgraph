import { Pool, PoolTransaction } from '../@types/schema'
import { LOG_JOIN } from '../@types/templates/BPool/BPool'
import { integer, PoolTransactionType } from './utils/constants'
import { gweiToEth } from './utils/generic'
import { getUser } from './utils/userUtils'

export function handleJoin(event: LOG_JOIN): void {
  const pool = Pool.load(event.address.toHex())

  // should we do something else here?
  if (pool === null || pool.isFinalized === true) return

  pool.transactionCount = pool.transactionCount.plus(integer.ONE)
  pool.joinCount = pool.joinCount.plus(integer.ONE)

  const poolTx = new PoolTransaction(event.transaction.hash.toHex())
  const user = getUser(event.params.caller.toHex())
  poolTx.user = user.id
  poolTx.pool = pool.id
  poolTx.type = PoolTransactionType.JOIN

  poolTx.timestamp = event.block.timestamp.toI32()
  poolTx.tx = event.transaction.hash
  poolTx.block = event.block.number.toI32()

  poolTx.gasPrice = gweiToEth(event.transaction.gasPrice.toBigDecimal())
  poolTx.gasLimit = event.transaction.gasLimit.toBigDecimal()

  poolTx.save()
  pool.save()
}
