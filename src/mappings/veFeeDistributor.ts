import { Address } from '@graphprotocol/graph-ts'
import {
  Claimed,
  CheckpointToken
} from '../@types/veFeeDistributor/veFeeDistributor'
import { weiToDecimal } from './utils/generic'
import { getveOCEAN, getVeFeeDistributor } from './utils/veUtils'
import { VeClaim, VeFeeDistributorCheckPoint } from '../@types/schema'
import { getToken } from './utils/tokenUtils'

export function handleClaimed(event: Claimed): void {
  const distributor = getVeFeeDistributor(event.address)
  const id =
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const veOcean = getveOCEAN(event.params.recipient.toHexString())
  const token = getToken(Address.fromString(distributor.token), false)
  const claim = new VeClaim(id)
  claim.amount = weiToDecimal(
    event.params.amount.toBigDecimal(),
    token.decimals
  )
  claim.claim_epoch = event.params.claim_epoch
  claim.max_epoch = event.params.max_epoch

  claim.veOcean = veOcean.id
  claim.VeFeeDistributor = distributor.id

  claim.block = event.block.number.toI32()
  claim.tx = event.transaction.hash.toHex()
  claim.eventIndex = event.logIndex.toI32()
  claim.timestamp = event.block.timestamp
  claim.save()
}

export function handleCheckpoint(event: CheckpointToken): void {
  const distributor = getVeFeeDistributor(event.address)
  const id =
    event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
  const token = getToken(Address.fromString(distributor.token), false)
  const checkpoint = new VeFeeDistributorCheckPoint(id)
  checkpoint.tokens = weiToDecimal(
    event.params.tokens.toBigDecimal(),
    token.decimals
  )
  checkpoint.sender = event.transaction.from.toHexString()
  checkpoint.block = event.block.number.toI32()
  checkpoint.tx = event.transaction.hash.toHex()
  checkpoint.eventIndex = event.logIndex.toI32()
  checkpoint.timestamp = event.params.time
  checkpoint.VeFeeDistributor = distributor.id
  checkpoint.save()
}
