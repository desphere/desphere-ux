import axios from 'axios';


export async function post({body}) {
  try {
  // console.log(body);
  let sendOut = await axios.post(`https://node.deso.org/api/v0/submit-transaction`,body, {
    headers: {
      'Referer': 'https://node.deso.org/', 
      'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept', 
      'Accept': 'application/json, text/plain, */*', 
      'Accept-Encoding': 'gzip, deflate, br', 
      'accept-language': 'en-US,en;q=0.9', 
      'origin': 'https://node.deso.org', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'same-site', 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36 Edg/89.0.774.77', 
      'Content-Type': 'application/json', 
    }
  });
  console.log(sendOut.data);
  return {
    status: 200,
    body: sendOut.data
  }
 } catch (ex) {
   console.error(ex);
   return {
     status: 500, 
     body: {
       success: false, 
       error: ex.message || "Unspecified Error."
     }
   };
 }
}