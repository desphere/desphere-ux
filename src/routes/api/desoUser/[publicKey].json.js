// import * as dotenv from 'dotenv';
// dotenv.config();
import axios from 'axios';



export async function get({params}) {
  try {
    const {publicKey} = params; 
    if (!publicKey) {
      throw new Error("no public key!");
    }

    // if you want a whitelist, add their public keys here
    const tWhitelist = [
    ];
    
    // if you want a whitelist, set this to false
    let foundInWhitelist = true;


    // if you want a whitelist, uncomment this 

    // for (var i of tWhitelist) {
    //   // console.log({a: i, b: publicKey});
    //   if (`${publicKey}`.includes(i)) {
    //     foundInWhitelist = true;
    //   }
    // }

    if (foundInWhitelist == false) {
      return {
        status: 412,
        body: {
          success: false,
          error: "This DeSo user is not authorized to purchase. If you're in the whitelist, please check back here soon."
        }
      }
    } else {
      let userData = await axios.post("https://node.deso.org/api/v0/get-users-stateless", {
        PublicKeysBase58Check: [
          publicKey
        ]
      });

      let {UserList = []} = userData.data;
      if (Array.isArray(UserList) && UserList.length) {
        return {
          status: 200,
          body: {
            BalanceNanos: UserList[0].BalanceNanos,
            ProfileEntryResponse: {
              Username: UserList[0].ProfileEntryResponse.Username
            }
          }
        };
      } else {
        throw new Error("user not found.");
      }
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