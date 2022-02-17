import { Nft, NftUpdate } from '../@types/schema'
import {
  MetadataCreated,
  MetadataState,
  MetadataUpdated,
  TokenURIUpdate
} from '../@types/templates/ERC721Template/ERC721Template'
import { NftUpdateType } from './utils/constants'
function getId(tx: string, nftAddress: string): string {
  return `${tx}-${nftAddress}`
}

export function handleCreated(event: MetadataCreated): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)
  if (!nft) return

  nft.assetState = event.params.state
  nft.providerUrl = event.params.decryptorUrl.toString()

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.type = NftUpdateType.METADATA_CREATED
  nftUpdate.userAddress = event.params.createdBy.toHex()
  nftUpdate.assetState = event.params.state

  nftUpdate.nft = nft.id
  nftUpdate.providerUrl = nft.providerUrl

  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

export function handleUpdated(event: MetadataUpdated): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)
  if (!nft) return

  nft.assetState = event.params.state

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.type = NftUpdateType.METADATA_UPDATED
  nftUpdate.userAddress = event.params.updatedBy.toHex()
  nftUpdate.assetState = event.params.state

  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

export function handleState(event: MetadataState): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)
  if (!nft) return

  nft.assetState = event.params.state

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.type = NftUpdateType.STATE_UPDATED
  nftUpdate.userAddress = event.params.updatedBy.toHex()
  nftUpdate.assetState = event.params.state

  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}

export function handleTokenUriUpdate(event: TokenURIUpdate): void {
  const nftAddress = event.address.toHex()
  const nft = Nft.load(nftAddress)

  if (!nft) return

  nft.tokenUri = event.params.tokenURI.toString()

  const nftUpdate = new NftUpdate(
    getId(event.transaction.hash.toHex(), nftAddress)
  )

  nftUpdate.type = NftUpdateType.TOKENURI_UPDATED
  nftUpdate.userAddress = event.params.updatedBy.toHex()
  nftUpdate.tokenUri = nft.tokenUri
  nftUpdate.timestamp = event.block.timestamp.toI32()
  nftUpdate.tx = event.transaction.hash.toHex()
  nftUpdate.block = event.block.number.toI32()

  nftUpdate.save()
  nft.save()
}
