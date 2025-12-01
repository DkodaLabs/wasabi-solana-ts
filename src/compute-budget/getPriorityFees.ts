
export type PriorityFeeResponse = {
  jsonrpc: string;
  result: {
    priorityFeeLevels: {
      min: number;
      low: number;
      medium: number;
      high: number;
      veryHigh: number;
      unsafeMax: number;
    }
  }
  id: string;
}


// Example POST method implementation: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
async function postData(url = '', data = {}, headers: any = {}) {
  // Default options are marked with *
  headers['Content-Type'] = 'application/json';
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: headers,
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json();
}

export const getPriorityFeeEstimate = async (url: string, accountKeys: string[]): Promise<PriorityFeeResponse> => {
  const body = {
    "jsonrpc": "2.0",
    "id": "helius-example",
    "method": "getPriorityFeeEstimate",
    "params": [
      {
        "accountKeys": accountKeys,
        "options": {
          "includeAllPriorityFeeLevels": true
        }
      }
    ]
  };

  return (await postData(url, {...body})) as PriorityFeeResponse;
}