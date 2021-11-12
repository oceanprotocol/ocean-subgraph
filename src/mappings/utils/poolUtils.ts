import { PoolToken } from '../../@types/schema'

export function getPoolTokenId(
  poolAddress: string,
  tokenAddress: string
): string {
  return `${poolAddress}-${tokenAddress}`
}

export function getPoolToken(
  poolAddress: string,
  tokenAddress: string
): PoolToken {
  let poolToken = PoolToken.load(getPoolTokenId(poolAddress, tokenAddress))
  if (poolToken === null) {
    poolToken = new PoolToken(getPoolTokenId(poolAddress, tokenAddress))
    // TODO: add data to pooltoken
  }

  return poolToken
}
