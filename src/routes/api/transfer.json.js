import axios from 'axios';


export async function post({body}) {
  try {
  // console.log(body);
  let sendOut = await axios.post(`https://bitclout.com/api/v0/accept-nft-transfer`,body, {
    headers: {
      'Referer': 'https://bitclout.com/', 
      'access-control-allow-headers': 'Origin, X-Requested-With, Content-Type, Accept', 
      'Accept': 'application/json, text/plain, */*', 
      'Accept-Encoding': 'gzip, deflate, br', 
      'accept-language': 'en-US,en;q=0.9', 
      'origin': 'https://bitclout.com', 
      'sec-fetch-dest': 'empty', 
      'sec-fetch-mode': 'cors', 
      'sec-fetch-site': 'same-site', 
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.128 Safari/537.36 Edg/89.0.774.77', 
      'Content-Type': 'application/json', 
    }
  });
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