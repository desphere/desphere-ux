import axios from 'axios';

export async function get({params}) {
  try {
    let {publicKey} = params;
    let {BASE_API_URL} = process.env;
    let tCount = await axios.get(`${BASE_API_URL}/nft/all`);

    let data = tCount.data;

    return {
      status: 200,
      body: {
        count: data.count
      }
    }

  } catch (ex) {
    console.error(ex);
    return {
      status: 500,
      error: ex.message || 'Unspecified Error.'
    }
  }
}

