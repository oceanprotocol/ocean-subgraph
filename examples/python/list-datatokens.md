## Ocean-subgraph python example

Query to fetch all datatoken "Transfer" events

```python
import requests
import json

datatoken_address = "0xd0a8540db74bab9ef5847a2424ee3fc26b4518a5"
base_url = "https://subgraph.rinkeby.oceanprotocol.com"
route = "/subgraphs/name/oceanprotocol/ocean-subgraph"
url = base_url + route

query_string = """{{tokenTransactions(skip: {0}, first: {1},
                where:{{event:"Transfer",datatokenAddress:"{2}"}},
                orderBy: timestamp, orderDirection: asc) {{
                id,
                event
                timestamp
                block
        }}}}"""

headers = {"Content-Type": "application/json"}

skip = 0
limit = 1000
result = []
while True:
    query = query_string.format(skip, limit, datatoken_address)
    payload = json.dumps({"query": query})
    response = requests.request("POST", url, headers=headers, data=payload)
    if response.status_code != 200:
        break
    data = json.loads(response.text)
    if (len(data["data"]["tokenTransactions"])) == 0:
        break
    result.append(data["data"])
    skip = skip + limit

print(result)
```