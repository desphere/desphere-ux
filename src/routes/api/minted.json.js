import axios from "axios";


export async function get({params}) {
  try {
    let {BASE_API_URL} = process.env;
    let tOut = await axios.get(BASE_API_URL + "/nft/minted");
    return {
      status: 200,
      body: {
        success: true,
        data: tOut.data.data
      }
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