## Ocean-subgraph python example

Query to fetch all datatoken `Transfer` events

```python
import requests
import json

datatoken_address = "0x00b43f5905ff736526294ac6de52d1dcd35821c9"
base_url = "https://subgraph.rinkeby.oceanprotocol.com"
route = "/subgraphs/name/oceanprotocol/ocean-subgraph"
url = base_url + route

query = """{{
    tokenOrders(where:{{datatokenId:"{0}"}}, first: 5, orderBy: timestamp, orderDirection: desc) {{
        id
        consumer {{id}}
        payer {{id}}
        serviceId
        marketFeeCollector {{id}}
        marketFee
        tx
        block
    }}
    }}""".format(datatoken_address)

headers = {"Content-Type": "application/json"}

payload = json.dumps({"query": query})
response = requests.request("POST", url, headers=headers, data=payload)
result = json.loads(response.text)


print(result)
```