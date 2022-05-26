import axios from "axios";

export async function get({params}) {
  try {
    let {TransactionHex} = params;
    let {BASE_API_URL} = process.env;
    let makeNFT = await axios.post(`${BASE_API_URL}/record/${TransactionHex}`, {});

    let hex = makeNFT.data;

    let {PostHashHex = null} = hex;

    if (PostHashHex == null) {
      throw new Error("did not get a post hex from nft service");
    } else {
      return {
        status: 200,
        body: {
          success: true,
          PostHashHex
        }
      };
    }


  } catch (ex) {
    console.error(ex);

    return {
      status: 500,
      body: {
        success: false,
        message: ex.message || "Unspecified Error"
      }
    };
  }
}