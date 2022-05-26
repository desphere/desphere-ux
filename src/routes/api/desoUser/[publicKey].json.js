// import * as dotenv from 'dotenv';
// dotenv.config();
import axios from 'axios';



export async function get({params}) {
  try {
    const {publicKey} = params; 
    if (!publicKey) {
      throw new Error("no public key!");
    }
    let userData = await axios.post("https://bitclout.com/api/v0/get-users-stateless", {
      PublicKeysBase58Check: [
        publicKey
      ]
    });

    let {UserList = []} = userData.data;
    if (Array.isArray(UserList) && UserList.length) {
      return {
        status: 200,
        body: UserList[0]
      };
    } else {
      throw new Error("user not found.");
    }
  } catch (ex) {
    console.error(ex);
    return {
      status: 500, 
      body: {
        success: false,
        error: ex.message || "Unexpected Error."
      }
    }
  }
}