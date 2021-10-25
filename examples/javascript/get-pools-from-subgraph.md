## Ocean-subgraph javascript example

Query to get all datatoken pools

```javascript
const axios = require('axios');

const BASE_URL = 'https://subgraph.rinkeby.oceanprotocol.com';
const SUBGRAPHS_QUERY_ROUTE = '/subgraphs/name/oceanprotocol/ocean-subgraph';

const url = BASE_URL + SUBGRAPHS_QUERY_ROUTE;

async function getAllPoolDatatokenAddresses(url) {
    const requestBody = { query: '{ pools(first:1000, orderBy: oceanReserve, orderDirection: desc) { id valueLocked name consumePrice totalShares symbol cap datatokenAddress tokens { id balance name symbol  } } }' };
    const response = await axios.post(url, requestBody).catch((error) => {
        const { status, statusText, data } = error.response;
        console.error('Error getting data from subgraph: ', status, statusText, data);
        throw new Error(statusText);
    });
    const { data: { data: { pools }, }, } = response;
    return pools.filter((pool) => pool.datatokenAddress).map((pool) => pool.datatokenAddress);
}

getAllPoolDatatokenAddresses(url).then(result => {
    console.log(result)
});

```


### Credits
- German Navarro - Github user: gmanavarro - Discord user: Naga#2072
- Axel Diaz - Github user: axeldiaz10 - Discord user: axeldiaz10#0085
- Juan Arrillaga - Github user: jarrillaga - Discord user: juanarri#3482