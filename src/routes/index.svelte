<script>
  import { Button, Jumbotron, Modal, ModalHeader, ModalBody, ModalFooter, Image, Container, Alert, Table, Icon, Popover, Spinner, Row, Col, ButtonGroup, InputGroup, InputGroupText, Input, Card, CardHeader, CardTitle, CardFooter, CardBody } from 'sveltestrap';

import { mobileAuth, passWindow, toggleLogin, toggleTheme, userProfile, userStore } from '../commonStore';
import Auth from '../components/Auth.svelte';
import axios from 'axios';
import * as b58c from 'noble-base58check';
import {v4} from 'uuid';
import { onMount } from 'svelte';
import { browser } from '$app/env';
// import { base } from '$app/paths';


  let identityWindow = null;

  let isFirefox = false;
  let open = false;
  let doRandom = true;
  let isLoading = false;
  let mintedPost = null;
  let needApproval = null;
  let viewType = 'grid';

  // put your base_api_url here
  let base_api_url = "";


  const toggle = () => {
    if (isLoading == false) {
      open = !open
    }
  };

  let theUser = null;
  userStore.subscribe(async u => {
    if (u !== theUser) {
      theUser = u;
      if (theUser !== null) {
        
        await getUser();
        }
    }
  });

  const getUser = async function() {
    if (browser) {
      try {
        if (theUser !== null) {
          // TODO WHITELIST!

          
          let uP = await fetch(`/api/desoUser/${theUser.publicKey}.json`);
          let jUP = await uP.json();
          let tCode = uP.status;
          if (tCode == 412) {
            alert(jUP.error || "Unspecified error on login. Please record this, and send to support");
            window.location.href = window.location.href;

          } else {
          userProfile.set(jUP);
          }
        }
      } catch (ex) {
        console.error(ex);
        alert(ex.message || "Unspecified error on login. Please record this, and send to support");
        window.location.href = window.location.href;
      }
    }
  }

  const logOut = async () => {
    $userProfile = null;
    $userStore = null;
    if (browser) {
      window.location.href = window.location.href;
    }
  }

  let txoStates = {};
  let newTran = null;

  onMount(() => {
    if (browser) {
      isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      window.addEventListener("message", ev => {
        let {id, payload} = ev.data;
        for (var o of Object.keys(txoStates)) {
          if (o == id) {
            txoStates[o] = payload;
          }
        }

        let {signedTransactionHex = null} = payload;
        if (signedTransactionHex !== null && newTran !== signedTransactionHex) {
          newTran = signedTransactionHex;
        } 
      });
    }
  });
  function getMobileOperatingSystem() {
    if (browser) {
      var userAgent = navigator.userAgent || navigator.vendor || window['opera'];

      // Windows Phone must come first because its UA also contains "Android"
      if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
      }

      if (/android/i.test(userAgent)) {
        return "Android";
      }

      // iOS detection from: http://stackoverflow.com/a/9039885/177710
      if (/iPad|iPhone|iPod/.test(userAgent) && !window['MSStream']) {
        return "iOS";
      }

      return "unknown";
    }
    
  }

  const waitForUuid = (uuid) => {
    return new Promise((res, rej) => {
      let isHit = false;
      let tI = setInterval(() => {
        // console.log(txoStates);
        if (txoStates[uuid] !== null) {
          if (isHit == false) {
            isHit = true;
            clearInterval(tI);
            res(txoStates[uuid]);
          }
        }
      }, 500);
    });
  };

  const waitForApproval = () => {
    let tran = newTran;
    return new Promise((res, rej) => {
      let isHit = false;
      let tI = setInterval(() => {
        if (tran !== newTran) {
          if (isHit == false) {
            isHit = true;
            clearInterval(tI);
            identityWindow.close();
            res(newTran);
          }
        }
      }, 500);
    });
  };

  const doWait = function(mills = 2000) {
    return new Promise((res, rej) => {
      setTimeout(() => {
        return res();
      }, mills)
    });
  }
  function hexStringToArrayBuffer(hexString) {
    // remove the leading 0x
    hexString = hexString.replace(/^0x/, '');
    
    // ensure even number of characters
    if (hexString.length % 2 != 0) {
        console.log('WARNING: expecting an even number of characters in the hexString');
    }
    
    // check for some non-hex characters
    var bad = hexString.match(/[G-Z\s]/i);
    if (bad) {
        console.log('WARNING: found non-hex characters', bad);    
    }
    
    // split the string into pairs of octets
    var pairs = hexString.match(/[\dA-F]{2}/gi);
    
    // convert the octets to integers
    var integers = pairs.map(function(s) {
        return parseInt(s, 16);
    });
    
    var array = new Uint8Array(integers);
    // console.log(array);
    
    return array;
  };

  export function base64ArrayBuffer(arrayBuffer) {
  let base64 = '';
  const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  const bytes = new Uint8Array(arrayBuffer);
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 3;
  const mainLength = byteLength - byteRemainder;

  let a;
  let b;
  let c;
  let d;
  let chunk;

  // Main loop deals with bytes in chunks of 3
  for (let i = 0; i < mainLength; i += 3) {
    // Combine the three bytes into a single integer
    chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

    // Use bitmasks to extract 6-bit segments from the triplet
    a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
    b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
    c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
    d = chunk & 63;        // 63       = 2^6 - 1

    // Convert the raw binary segments to the appropriate ASCII encoding
    base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
  }

  // Deal with the remaining bytes and padding
  if (byteRemainder === 1) {
    chunk = bytes[mainLength];

    a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

    // Set the 4 least significant bits to zero
    b = (chunk & 3) << 4; // 3   = 2^2 - 1

    base64 += `${encodings[a]}${encodings[b]}==`;
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1

    base64 += `${encodings[a]}${encodings[b]}${encodings[c]}=`;
  }

  return base64;
}
  let loadingText = '';

  let tObject = null;
  let tUID = null;
  let skipTxo = null;
  
  
  let wait = false;
  let selected = null;
  let doSelect = undefined;

  let showMintSkip = false;
  let showSkipButton = false;
  let showBuyButton = false; 

  const skipThis = async () => {
    let conf = confirm("Skipping costs 0.06 DESO. Click 'OK' to accept this purchase, click 'Cancel' to go back.");
    if (conf == true) {
      showMintSkip = false
      // TODO run second transaction
      loadingText = 'Attempting skip transaction...'
      let skipPayload = {
        SenderPublicKeyBase58Check: $userStore.publicKey,
        RecipientPublicKeyOrUsername: 'DeSpherex',
        MinFeeRateNanosPerKB: 1000,
        AmountNanos: 0.06 * 1e9
      };

      let skipOut = await axios.post("/api/send.json", skipPayload);
      let outData = skipOut.data;

      let {TransactionHex = null} = outData;

      if (TransactionHex == null) {
        throw new Error("No tHex in skip send-bitclout! Please record this for support.");
      }

      let iWindow = document.getElementById('identity');

      let uqid = v4();

      iWindow.contentWindow.postMessage({
        id: uqid,
        service: 'identity', 
        method: 'sign',
        payload: {
          accessLevel: $userStore.accessLevel,
          accessLevelHmac: $userStore.accessLevelHmac,
          encryptedSeedHex: $userStore.encryptedSeedHex,
          transactionHex: TransactionHex
        }
      }, "*");
      txoStates[uqid] = null;
      
      let signResult = await waitForUuid(uqid);
      let {approvalRequired = false, signedTransactionHex = null} = signResult;

      if (approvalRequired) {
        showSkipButton = TransactionHex;
        loadingText = 'Getting approval for skip purchase...';

        let ttt = getMobileOperatingSystem();
        if (ttt == 'iOS') {
          identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + TransactionHex, null, 'toolbar=no, width=800, height=1000, top=0, left=0');

        } else {
          identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + TransactionHex, null, 'toolbar=no, width=800, height=1000, top=0, left=0');

        }
        await waitForApproval();
        signedTransactionHex = newTran;
        showSkipButton = false;
      }
      loadingText = 'Submitting signed purchase transaction for skip action...';

      let submitOut = await axios.post("/api/submit.json", {
        TransactionHex: signedTransactionHex
      });

      let submitData = submitOut.data;

      let {TxnHashHex} = submitData;
      let txnArray = hexStringToArrayBuffer(TxnHashHex);
      let txn58Array = Uint8Array.from([
        205, 20, 0, ...txnArray
      ]); 
      let txCheck = await b58c.encode(txn58Array);

      loadingText = 'skip tx complete. spawning a new one..';
      await doWait(2000);
      tObject = null;
      tUID = null;
      skipTxo = txCheck;
      wait = false;
    }
  };

  const mintThis = async () => {
    let conf = confirm("Are you sure you want this NFT?");
    if (conf == true) {
      showMintSkip = false;
      loadingText = 'NFT selected! Still loading..';
      let mintResult = await fetch(`${base_api_url}/recordRandom/${tUID}/select`);
      let mRes = await mintResult.json();
      selected = mRes;
      doSelect = null;
      wait = false;
    }
  }
  const doRandomPurchase = async (txCheck) => {
    try {
    doSelect = undefined;
    while (doSelect === undefined) {
      tUID = null;
      tObject = null;

      loadingText = 'Fetching random nft..';

      let newOcto = (typeof skipTxo == 'string') ? await fetch(`${base_api_url}/recordRandom/${txCheck}/reissue/${skipTxo}`, {mode: 'cors'}) :  await fetch(`${base_api_url}/recordRandom/${txCheck}/issue`, {mode: 'cors'});
     
      let newOctoImage = await newOcto.arrayBuffer();
      let newOctoUID = newOcto.headers.get('x-uuid');
      console.log({newOctoUID, h: newOcto.headers});

    
      let newOctoB64 = base64ArrayBuffer(newOctoImage);
      let tHead = 'data:image/png;base64,';

      tObject = `${tHead}${newOctoB64}`

      tUID = newOctoUID;
      loadingText = 'Would you like to mint this NFT, or skip?';
      
      await doWait(250);
      showMintSkip = true;
      wait = true;
      // document.getElementById('randoPreview').style.backgroundImage = `url(${tObject});`;
      while (wait == true) {
        await doWait(250);
      }
    }
    skipTxo = null;

    return selected;
    } catch (ex) {
      console.error(ex);
      throw ex;
    }
    
  }

  const startPurchase = async () => {
    console.log("starting purchase");
    isLoading = true;
    mintedPost = null;
    try {
    let {BalanceNanos} = $userProfile;
    const nCount = await fetch(`/api/count/${$userStore.publicKey}.json`);
    const tCount = await nCount.json();

    console.log(tCount);
    let {count} = tCount;
    if (count >= 1400) {
      console.warn("over limit");
      alert("We're sold out! Sorry!");
    } else if (BalanceNanos / 1e9 < 0.3 ) {
      console.warn("not enough deso");
      alert("You don't have enough $DESO in this account! Try signing into an account with enough $DESO");
    } else {
      // initiate deso transfer
      let sendPayload = {
        SenderPublicKeyBase58Check: $userStore.publicKey,
        RecipientPublicKeyOrUsername: 'DeSphere',
        MinFeeRateNanosPerKB: 1000,
        AmountNanos: 0.3 * 1e9
      };

      loadingText = 'Initializing Purchase...';

      let sendOut = await axios.post("/api/send.json", sendPayload);
      let outData = sendOut.data;

      let {TransactionHex = null}  = outData;

      if (TransactionHex == null) {
        throw new Error("No transaction hex! send-bitclout failed.");
      }

      let iWindow = document.getElementById("identity");
      let uuid = v4();

      loadingText = 'Requesting Signature for Purchase...';

      iWindow.contentWindow.postMessage({
        id: uuid, 
        service: 'identity', 
        method: 'sign',
        payload: {
          accessLevel: $userStore.accessLevel,
          accessLevelHmac: $userStore.accessLevelHmac,
          encryptedSeedHex: $userStore.encryptedSeedHex,
          transactionHex: TransactionHex
        }
      }, "*");

      txoStates[uuid] = null;

      let signResult = await waitForUuid(uuid);

      let {approvalRequired = false, signedTransactionHex = null} = signResult;

      if (approvalRequired) {
        showBuyButton = TransactionHex;
        loadingText = 'Getting approval for purchase...';

        let ttt = getMobileOperatingSystem();
        if (ttt == 'iOS') {
          identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + TransactionHex, null, 'toolbar=no, width=800, height=1000, top=0, left=0');

        } else {
          identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + TransactionHex, null, 'toolbar=no, width=800, height=1000, top=0, left=0');

        }
        await waitForApproval();
        signedTransactionHex = newTran;
        showBuyButton = false;
      }
      loadingText = 'Submitting signed purchase transaction...';

      let submitOut = await axios.post("/api/submit.json", {
        TransactionHex: signedTransactionHex
      });

      let submitData = submitOut.data;

      // now, lets get and store that txo hash
      let {TxnHashHex} = submitData;
      let txnArray = hexStringToArrayBuffer(TxnHashHex);
      let txn58Array = Uint8Array.from([
        205, 20, 0, ...txnArray
      ]); 
      let txCheck = await b58c.encode(txn58Array);
      loadingText = 'Transaction signed and submitted. Plz wait. Transaction ID: ' + txCheck;

      // it's go time! record this, and start vending
      // console.log(txCheck);
      await doWait(1000);

      // loadingText = 'Fetching an octo...';
      loadingText = doRandom == true ? 'starting minting process..' : 'Minting NFT...';
      let tMinted = doRandom == true ? await doRandomPurchase(txCheck) : await(await fetch(`${base_api_url}/record/${txCheck}`, {
        mode: 'no-cors',
        method: 'post',
        body: ''
      })).json();

     



      let minted = tMinted;



      let {uuid: mintuid = null} = minted;

      
      loadingText = '';
      mintedPost = base_api_url + '/nft/status/' + mintuid;

      // if (PostHashHex == null) {
      //   throw new Error("PostHashHex is null");
      // } else {
      //   loadingText = 'NFT Minted! Starting transfer...';

      //   let acceptUUID = v4();
      //   txoStates[acceptUUID] = null;

      //   await doWait(5000);
      //   let submitAccept = await axios.post(`/api/transfer.json`, JSON.stringify({
      //     MinFeeRateNanosPerKB: 1000,
      //     NFTPostHashHex: PostHashHex,
      //     SerialNumber: 1,
      //     UpdaterPublicKeyBase58Check: $userStore.publicKey
      //   }), {
      //     headers: {
      //       'Content-Type' : 'application/json',
      //       'accept' : 'application/json'
      //     }
      //   });

      //   let {TransactionHex: TransactionHex2} = submitAccept.data;

      //   loadingText = 'Signing transfer...';

      //   iWindow.contentWindow.postMessage({
      //     id: acceptUUID, 
      //     service: 'identity', 
      //     method: 'sign',
      //     payload: {
      //       accessLevel: $userStore.accessLevel,
      //       accessLevelHmac: $userStore.accessLevelHmac,
      //       encryptedSeedHex: $userStore.encryptedSeedHex,
      //       transactionHex: TransactionHex2
      //     }
      //   }, "*");

      //   let signResult2 = await waitForUuid(acceptUUID);

      //   let {approvalRequired: approvalRequired2 = false, signedTransactionHex: signedTransactionHex2 = null} = signResult2;
      //   if (approvalRequired2) {

      //     loadingText = 'Requesting approval for NFT transfer...';

          
      //     needApproval = TransactionHex2;
      //     newTran = null;

      //     identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + TransactionHex2, null, 'toolbar=no, width=800, height=1000, top=0, left=0');
      //     await waitForApproval();
      //     signedTransactionHex2 = newTran;
      //   }
      //   loadingText = 'Submitting signed approval for NFT transfer...';

      //   let submitOut = await axios.post("/api/submit.json", {
      //     TransactionHex: signedTransactionHex2
      //   });

      //   mintedPost = 'https://diamondapp.com/nft/' + PostHashHex;

      //   loadingText = '';
        
      // }


    }
    } catch (ex) {
      console.error(ex);
      alert("There was an error during purchase. Please record this and send to support: " + ex.message || "Unspecified Error");
    } finally {
      isLoading = false;
      needApproval = null;
      getUser();
    }
  }


  let tryPop = false;
  let tryTryPop = false;
  let popApproval = async function() {
    // identityWindow = null;
    // await doWait(500);
    let t = getMobileOperatingSystem();
    if (t == 'iOS') {
      identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + needApproval, '_blank', 'toolbar=no, width=800, height=1000, top=0, left=0');
    } else if (tryPop == true) {
      if (tryTryPop == false) {
        tryTryPop = true;
        identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + needApproval, '_blank', 'toolbar=no, width=800, height=1000, top=0, left=0');

      } else {
        let idw = window.open("https://identity.bitclout.com/approve?tx=" + needApproval, null, 'toolbar=no, width=800, height=1000, top=0, left=0');
        iWindow = idw;
      }



    } else {
      tryPop = true;
      identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + needApproval, null, 'toolbar=no, width=800, height=1000, top=0, left=0');

    }
  }
  let tryTryPop2 = false;
  let tryPop2 = false;

  let doPop = async function(tHex) {
    identityWindow = null;
    await doWait(500);
    let t = getMobileOperatingSystem();
    if (t == 'iOS') {
      identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + tHex, '_blank', 'toolbar=no, width=800, height=1000, top=0, left=0');
    } else if (tryPop2 == true) {
      if (tryTryPop2 == false) {
        tryTryPop = true;
        identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + tHex, '_blank', 'toolbar=no, width=800, height=1000, top=0, left=0');

      } else {
        tryTryPop2 = false;
        let idw = window.open("https://identity.bitclout.com/approve?tx=" + tHex, null, 'toolbar=no, width=800, height=1000, top=0, left=0');
        iWindow = idw;
        
      }



    } else {
      tryPop2 = true;
      identityWindow = window.open("https://identity.bitclout.com/approve?tx=" + tHex, null, 'toolbar=no, width=800, height=1000, top=0, left=0');

    }
  }

  let existingPayload = null;
  let showReset = false;
  let sortBy = 'rarity';


  const alreadyMinted = async function(searchNum = null) {
    if (browser) {
      try {
        if (existingPayload !== null && searchNum !== null) {
          let {data = []} = existingPayload;
          let dd = {
            data: []
          };
          for (var d of data) {
            let {name} = d;
            if (name == `#${searchNum}`) {
              dd.data.push(d);
            }
          }
          showReset = true;
          return dd;
        } else {
          await doWait(2000);
          // let t = await fetch('${base_api_url}/nft/minted', {mode: 'no-cors'});
          // let tt = await t.json();

          let t = await fetch(`/api/minted.json`);
          let tt = await t.json();
          if (typeof tt !== undefined) {
            console.log(tt);
            if (tt.success !== true) {
              throw new Error("Error getting list. Please refresh.");
            }
          } else {
            throw new Error("Error getting list. Please refresh.");
          }
          existingPayload = tt;
          if (sortBy == 'id') {
            // let {data = []} = existingPayload;
            let data = tt.data.sort((a, b) => {
              let {name: aa} = a;
              let {name: bb} = b;
              let aaa = aa.replace("#", "");
              let bbb = bb.replace("#", "");
              // console.log({aaa, bbb});
              return parseInt(bbb) - parseInt(aaa) ;
            });
            return tt;
          } else {
            return tt;
          }
          
        }
      } catch (ex) {
        console.error(ex);
        throw ex;
        // window.location.href = window.location.href;
      }
    }
    

    
  }

  let doSort = async function(rarityOrID) {
    if (rarityOrID == 'id') {
      sortBy = 'id';
    } else {
      sortBy = 'rarity';
    }
    getMinted = alreadyMinted();
  }




  let getMinted = alreadyMinted();

  let refreshList = async function() {
    getMinted = alreadyMinted();
    toggle();
  }

  let doSearch = async function() {
    if (browser) {
      let {value = 0} = document.getElementById('searchNum');
      if (value !== 0) {
        getMinted = alreadyMinted(value);
      }
    }
  };

  let resetSearch = async function() {
    if (browser) {
      getMinted = alreadyMinted();
      showReset = false;
      document.getElementById('searchNum').value = null;
    }
    
  }

  let doRefresh = async function() {
    if (browser) {
      window.location.href = window.location.href;
    }
  }
</script>
<style>
  .listImage {
    min-height: 50px;
    min-width: 50px;
    max-height: 150px;
    max-width: 150px;
    
  }
  .smallerText {
    font-size: 0.9rem;
    /* line-height: 0.7rem; */
  }
  .evenSmallerText {
    font-size: 0.7rem;
  }
  @media only screen and (max-width: 600px) {
  .listImage {
    max-height: 100px;
    max-width: 100px;
  }
}

.shade:hover {
    -webkit-filter: brightness(85%);
    -webkit-transition: all 10ms ease;
    -moz-transition: all 10ms ease;
    -o-transition: all 10ms ease;
    -ms-transition: all 10ms ease;
    transition: all 10ms ease;
}

.padding025 {
  padding: 0.25rem 0.25rem !important;
}
  .randoPreview {
    max-width: 300px;
  }
</style>
<Auth bind:identityWindow={identityWindow} />
<Jumbotron>
  <h1 class="text-center">
    <a href="https://diamondapp.com/u/YOUR_NFT_PROJECT" target="_blank">YOUR_NFT_PROJECT</a>
  </h1>
  <h4 class="text-center">YOUR NFT PROJECT<br />
    {#if $userStore !== null}
    Logged in as 
      {#if $userProfile !== null}
        {#if $userProfile.ProfileEntryResponse}
          {$userProfile.ProfileEntryResponse.Username}
        {:else}
          {$userStore.publicKey}
        {/if}
        <br />{$userProfile.BalanceNanos / 1e9} $DESO available
      {:else}
        {$userStore.publicKey}
      {/if}
      <br />
    <Button color="primary" class="text-center" on:click={toggle}>Buy One Today (0.3 $DESO)</Button> <br /><br />
    <Button color="primary" class="text-center" on:click={logOut}>Log Out</Button>
    {:else}
      <h5 class="text-center">To purchase a new one, you must login with DeSo. Click the button below to continue.</h5>
      {#if $mobileAuth == true} 
        <Button color="primary" on:click={() => $passWindow = true}>Login with DeSo</Button>
      {:else}
        <Button color="primary" on:click={() => $toggleLogin = true}>Login with DeSo</Button>
      {/if}
    {/if}
  </h4>
</Jumbotron>
<div class="container-md">
  {#await getMinted}
    <h3 class="text-center">
      <Spinner color="dark" /> Loading list of minted NFTs...
    </h3>
  {:then mintedNFTs}
  <h2 class="text-center my-4">Already Minted: {#if existingPayload !== null}{existingPayload.data.length}{/if}</h2>
    <Row>
      <div class="col-12 col-md my-2">
        <InputGroup>
          <InputGroupText>Search for #</InputGroupText>
          <Input placeholder="#" type="number" id="searchNum" />
          <Button on:click={doSearch}>Search</Button>
          {#if showReset == true}
            <Button on:click={resetSearch} color="warning">Reset Search</Button> 
          {/if}
        </InputGroup>
        
      </div>
      <div class="col-6 col-md-auto my-2">
        <ButtonGroup>
        <Button active={viewType == 'list'} on:click={() => viewType='list'}>
          <Icon name="list-ol"></Icon>
        </Button>
        <Button active={viewType == 'grid'} on:click={() => viewType='grid'}>
          <Icon name="grid-3x3-gap-fill"></Icon>
        </Button>
        </ButtonGroup>
      </div>
      <div class="col-6 col-md-auto my-2">
        <ButtonGroup>
        <Button active={sortBy == 'rarity'} on:click={() => doSort('rarity')}>
          Sort by Rarity
        </Button>
        <Button active={sortBy == 'id'} on:click={() => doSort('id')}>
          Sort by ID
        </Button>
        </ButtonGroup>
      </div>
    </Row>
    <hr />
    {#if viewType == 'list'}
    <Table>
      <thead>
        <tr>
          <th>Image</th>
          <th>#</th>
          <th>Rarity</th>
          <th>Post</th>
        </tr>
      </thead>
      <tbody>
        {#each mintedNFTs.data as nft}
          <tr>
            <td>
              <img src="{nft.imageURL}" class="listImage" alt="image for {nft.name}" />
            </td>
            <td>
              <h4>
              {nft.name}
              </h4>
            </td>

            <td>
              <h4>{Math.round(10000 * nft.rarity) / 10000} <Button size='sm' id="rarityBtn-{nft.posthex}" class="padding-025"><Icon name="info"></Icon></Button>
              </h4>
              <Popover trigger="click" target='rarityBtn-{nft.posthex}' placement='bottom' title="Rarity for {nft.name}">
                <b>The lower the number, the more scarcity (higher rarity, lower number)</b><br />
                <strong>Total Rarity</strong><br />{Math.round(10000 * nft.rarity) / 10000}<br />
                <Row>
                {#each nft.attributes as attrib}
                  <Col xs='4'>
                    <span class="evenSmallerText my-2">
                      <strong>{attrib.trait_type}</strong><br />{attrib.value}<br />{Math.round(100000 * attrib.rarity) / 1000 }
                    </span>
                  </Col>
                
                {/each}
                </Row>
              </Popover>
              
            </td>
            <td>
              <h4>
                <a class="btn btn-sm btn-info" href="https://diamondapp.com/nft/{nft.posthex}" target="_blank">View on DeSo</a>
              </h4>
            </td>
          </tr>
        {/each}
      </tbody>
    </Table>
    {:else}
    <div class="row">
      {#each mintedNFTs.data as nft}
      <div class="col-6 col-sm-4 col-md-3">
      <Card class="m-2">
        <CardHeader>
          <CardTitle>
            {nft.name}
          </CardTitle>
        </CardHeader>
        <CardBody>
          <a href="https://diamondapp.com/nft/{nft.posthex}" target="_blank" id="cardImage">
          <img src="{nft.imageURL}" alt="image for {nft.name}" class="shade img-fluid" />
          </a>
        </CardBody>
        <CardFooter>
          <div class="row">
            <div class="col smallerText">
              Rarity {Math.round(1000 * nft.rarity) / 1000} 
              <button class="btn btn-sm padding025 btn-outline-info" id="rarityBtn-{nft.posthex}">
                <Icon name="info"></Icon>
              </button>
            <Popover trigger="click" target='rarityBtn-{nft.posthex}' placement='bottom' title="Rarity for {nft.name}">
              <b>The lower the number, the more scarcity (higher rarity, lower number)</b><br />
              <strong>Total Rarity</strong><br />{Math.round(10000 * nft.rarity) / 10000}<br />
              <Row>
              {#each nft.attributes as attrib}
                <Col xs='4'>
                  <span class="evenSmallerText my-2">
                    <strong>{attrib.trait_type}</strong><br />{attrib.value}<br />{Math.round(100000 * attrib.rarity) / 1000}
                  </span>
                </Col>
              
              {/each}
              </Row>
            </Popover>
            </div>
          </div>
        </CardFooter>
      </Card>
      </div>
      {/each}
    </div>
    {/if}
  {:catch ex}
    <Alert color="danger">Error getting list: {ex.message || 'Unspecified Error'}</Alert>
  {/await}
  </div>

<Modal isOpen={open} {toggle}>
  <ModalHeader {toggle}>Purchase</ModalHeader>
  <ModalBody>
    Click the button below to begin the NFT purchase and minting process. 
    Once you've clicked the button below (and accepted the $DESO transfer), please wait approximately 2 minutes until the next step. DO NOT LEAVE THIS PROMPT UNTIL INSTRUCTED TO DO SO!<br />PLEASE DISABLE POPUP BLOCKERS!!
    {#if mintedPost !== null}
      <br /><br />
     Your NFT has been put in the minting queue.  While this process typically takes 30 minutes or less, THIS PROCESS CAN TAKE OVER AN HOUR, PLEASE BE PATIENT!<br /><a href="{mintedPost}" target="_blank" class="btn btn-md btn-info">Click here to track the progress of your NFT!</a> 
    {:else if mintedPost == null && needApproval !== null}
      <Button block color="warning" on:click={() => popApproval()}>
        Click here to accept the NFT transfer.
      </Button>
    {:else if showSkipButton !== false}
    <Button block color="warning" on:click={() => doPop(showSkipButton)}>
      Click here to accept the Skip NFT purchase.
    </Button>
    {:else if showBuyButton !== false}
    <Button block color="warning" on:click={() => doPop(showBuyButton)}>
      Click here to accept the Initial NFT purchase.
    </Button>
    {/if}
    {#if tObject !== null && doSelect === undefined}
      <br />
      <img src="{base_api_url}/img/{tUID}" style="width:300px;height:300px;" id="randoPreview" class="randoPreview" alt="DeSpherePreview" /><br />
      {#if showMintSkip == true}
      <Button on:click={() => mintThis()}>Mint This</Button> <Button on:click={() => skipThis()}>Skip</Button>
      {/if}
    {/if}
    {#if isLoading == true} 
      <br /> {loadingText}
    {/if}
  </ModalBody>
  <ModalFooter>
    {#if isLoading == true}
      <h5>
        <Spinner color="info" type="border" /> Loading, please wait... 
      </h5>
    {:else}
      {#if mintedPost !== null}
      <!-- <Button color="primary" on:click={startPurchase}>Purchase Another!</Button> -->
      <Button color="secondary" on:click={() => doRefresh()}>See Rarity Stats / Mint Another / Reload</Button>
      {:else}
      <Button color="primary" on:click={startPurchase}>Purchase Now!</Button>
      {#if isLoading !== true}
        <Button color="secondary" on:click={toggle}>Cancel</Button>
      {/if}
      {/if}
    {/if}
  </ModalFooter>
</Modal>
