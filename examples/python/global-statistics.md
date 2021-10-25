
## Ocean-subgraph python example

Query global statistics like `totalValueLocked`, `totalOceanLiquidity`, `orderCount`, etc.

```python
import requests
import json

base_url = "https://subgraph.rinkeby.oceanprotocol.com"
route = "/subgraphs/name/oceanprotocol/ocean-subgraph"
url = base_url + route

query = """
{
globals {
  id
  totalValueLocked
  totalOceanLiquidity
  totalSwapVolume
  totalOrderVolume
  orderCount
  poolCount
}
}"""

headers = {"Content-Type": "application/json"}

payload = json.dumps({"query": query})
response = requests.request("POST", url, headers=headers, data=payload)
result = json.loads(response.text)

print(result)
```
