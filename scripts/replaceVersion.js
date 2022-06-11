const fs = require('fs')
const packageJson = require('../package.json')

async function replaceVersion() {
  let globalUtils = fs.readFileSync(
    './src/mappings/utils/globalUtils.ts',
    'utf8'
  )
  globalUtils = globalUtils.replace(
    /.*globalStats\.version.*\n/,
    "    globalStats.version = '" + packageJson.version + "'\n"
  )

  fs.writeFileSync('./src/mappings/utils/globalUtils.ts', globalUtils, 'utf8')
}

replaceVersion()
