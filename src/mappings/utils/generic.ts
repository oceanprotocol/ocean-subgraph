import { BigDecimal, BigInt, dataSource } from '@graphprotocol/graph-ts'

const network = dataSource.network()

export function getOceanAddress(): string {
  // switch is not working for some reason
  if (network == 'ropsten') return '0x5e8dcb2afa23844bcc311b00ad1a0c30025aade9'
  if (network == 'rinkeby') return '0x5e8DCB2AfA23844bcc311B00Ad1A0C30025aADE9'
  if (network == 'polygon') return '0x282d8efce846a88b159800bd4130ad77443fa1a1'
  if (network == 'moonbeamalpha')
    return '0xf6410bf5d773c7a41ebff972f38e7463fa242477'
  if (network == 'gaiaxtestnet')
    return '0x80e63f73cac60c1662f27d2dfd2ea834acddbaa8'
  if (network == 'catenaxtestnet')
    return '0x80e63f73cac60c1662f27d2dfd2ea834acddbaa8'
  if (network == 'mumbai') return '0xd8992ed72c445c35cb4a2be468568ed1079357c8'
  if (network == 'bsc') return '0xdce07662ca8ebc241316a15b611c89711414dd1a'
  if (network == 'celoalfajores')
    return '0xd8992ed72c445c35cb4a2be468568ed1079357c8'
  if (network == 'energyweb')
    return '0x593122aae80a6fc3183b2ac0c4ab3336debee528'
  if (network == 'moonriver')
    return '0x99c409e5f62e4bd2ac142f17cafb6810b8f0baae'
  return '0x967da4048cd07ab37855c090aaf366e4ce1b9f48'
}

export function getOpfCollectorAddress(): string {
  // switch is not working for some reason
  if (network == 'ropsten') return '0x5e8dcb2afa23844bcc311b00ad1a0c30025aade9'
  if (network == 'rinkeby') return '0x2f311Ba88e2609D3A100822EdAC798eb0a8F4835'
  if (network == 'polygon') return '0x282d8efce846a88b159800bd4130ad77443fa1a1'
  if (network == 'moonbeamalpha')
    return '0xf6410bf5d773c7a41ebff972f38e7463fa242477'
  if (network == 'gaiaxtestnet')
    return '0x80e63f73cac60c1662f27d2dfd2ea834acddbaa8'
  if (network == 'catenaxtestnet')
    return '0x80e63f73cac60c1662f27d2dfd2ea834acddbaa8'
  if (network == 'mumbai') return '0xd8992ed72c445c35cb4a2be468568ed1079357c8'
  if (network == 'bsc') return '0xdce07662ca8ebc241316a15b611c89711414dd1a'
  if (network == 'celoalfajores')
    return '0xd8992ed72c445c35cb4a2be468568ed1079357c8'
  if (network == 'energyweb')
    return '0x593122aae80a6fc3183b2ac0c4ab3336debee528'
  if (network == 'moonriver')
    return '0x99c409e5f62e4bd2ac142f17cafb6810b8f0baae'
  return '0x967da4048cd07ab37855c090aaf366e4ce1b9f48'
}


export const OCEAN: string = getOceanAddress()

export function weiToDecimal(amount: BigDecimal, decimals: i32): BigDecimal {
  const scale = BigInt.fromI32(10)
    .pow(decimals as u8)
    .toBigDecimal()
  return amount.div(scale)
}

export function gweiToEth(ammount: BigDecimal): BigDecimal {
  return ammount.div(BigDecimal.fromString('1.000.000.000'))
}
