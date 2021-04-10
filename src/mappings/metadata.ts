import { BigInt, ethereum } from '@graphprotocol/graph-ts'
import { MetadataUpdated, MetadataCreated } from '../@types/Metadata/Metadata'

import { Datatoken, MetadataUpdate } from '../@types/schema'

export function handleMetadataEvent(
  event: ethereum.Event,
  dtAddress: string,
  updatedBy: string,
  created: boolean
): void {
  const datatoken = Datatoken.load(dtAddress)
  if(datatoken){
    const tx = event.transaction.hash
    const id = tx.toHexString().concat('-').concat(dtAddress)
    const metadataUpdate = new MetadataUpdate(id)
    metadataUpdate.tx = tx
    metadataUpdate.block = event.block.number.toI32()
    metadataUpdate.timestamp = event.block.timestamp.toI32()
    metadataUpdate.datatokenAddress = dtAddress
    metadataUpdate.userAddress = updatedBy
    metadataUpdate.datatokenId = dtAddress
    metadataUpdate.save()
    datatoken.metadataUpdateCount = datatoken.metadataUpdateCount.plus(
      BigInt.fromI32(1)
    )
    datatoken.save()
  }
}

export function handleMetadataUpdated(event: MetadataUpdated): void {
  handleMetadataEvent(
    event,
    event.params.dataToken.toHexString(),
    event.params.updatedBy.toHexString(),
    false
  )
}

export function handleMetadataCreated(event: MetadataCreated): void {
  handleMetadataEvent(
    event,
    event.params.dataToken.toHexString(),
    event.params.createdBy.toHexString(),
    true
  )
}
