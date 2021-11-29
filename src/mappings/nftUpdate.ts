import {
  MetadataCreated,
  MetadataState,
  MetadataUpdated,
  TokenURIUpdate
} from '../@types/templates/ERC721Template/ERC721Template'

export function handleCreated(event: MetadataCreated): void {}

export function handleUpdated(event: MetadataUpdated): void {}

export function handleState(event: MetadataState): void {}

export function handleUriUpdate(event: TokenURIUpdate): void {}
