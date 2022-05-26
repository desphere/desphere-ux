
<script lang="ts">

// const jwt = require("jsonwebtoken");


// import { onMount } from "svelte";
import {toggleLogin, bitCloutAuthUser, loginDone, userStore, mobileAuth, passWindow} from "../commonStore";
import { v4 } from "uuid";

import {browser} from '$app/env';
import { onMount } from "svelte";

let pm_id = '';
export let source = null;
let pendingRequests = [];
export let identityWindow = null;
let accessLevel = 2;
let user = null;
let useJWT = false;
let isMobile = false;


passWindow.subscribe(w => {
  if (browser) {
    if (w == true) {
      identityWindow = window.open('https://identity.bitclout.com/log-in?accessLevelRequest=2', null, 'toolbar=no, width=800, height=1000, top=0, left=0')
    }
  }
});
function respond(e, t, n) {
  if (typeof e !== 'undefined') {
    if (e !== null) {

      e.postMessage({
        id: t,
        service: "identity"
      }, "*");
    }
  }
}
function respondMobile(e, t, n) {
  if (typeof e !== 'undefined') {
    if (e !== null) {
      
      e.postMessage({
        id: t,
        service: "identity", 
        method: "info"
      }, "*");
    }
  }
}
// adopted from https://github.com/BogdanDidenko/react-bitclout-login/blob/main/src/BitcloutLogin.js
function handleLogin(payload) {
    user = payload['users'][payload.publicKeyAdded]
    user['publicKey'] = payload.publicKeyAdded;
    if (identityWindow) {
      bitCloutAuthUser.set(user);

      if (useJWT === false) {
        userStore.set(user);
        loginDone.set(true);
        identityWindow.close();
        identityWindow = null;
      } else {
        let payload = {
          accessLevel: user.accessLevel,
          accessLevelHmac: user.accessLevelHmac,
          encryptedSeedHex: user.encryptedSeedHex
        };
        source.postMessage({
          id: pm_id,
          service: 'identity',
          method: 'jwt',
          payload: payload
        }, "*");
      }
    }
  }
    function handleJWT(payload) {
      if (browser) {
      user['jwt'] = payload['jwt'];
      if (identityWindow) {
        identityWindow.close();
        identityWindow = null;
      }
      userStore.set(user);
      loginDone.set(true);
      // localStorage.setItem('btu', JSON.stringify(user));
      // bitCloutAuthUser.set(user);
      }
    }
async function doInit(source) {
  let tu = localStorage.getItem("btu");
  if (tu) {
    try {
      let ju = JSON.parse(tu);
      user = ju;
      // let tToken = ju.cc.jwt;
      localStorage.removeItem("btu");
      
      
    } catch (ex) {
      localStorage.removeItem("btu");
      // console.error(ex);
    } finally {
      loginDone.set(true);
    }
  } else {
    loginDone.set(true);
  }
}


let windowEventListener = async (message) => {
  
  const { data: { id: id, method: method, service: service, payload: payload } } = message;
  
  let {hasStorageAccess = null, browserSupported = null} = payload;
  
  if (service !== "identity") {return;}
  
  // alert(JSON.stringify({id, method, service, payload}));
  // console.log({identityMethod: method, payload});

  if (method == 'initialize') {
    for (let o of pendingRequests) {
      // console.log(o);
      o.source.postMessage(o, "*");
    }

    pendingRequests = [];
    pm_id = message.data.id;
    source = message.source;
    respond(message.source, message.data.id, {});
    if (isMobile == true) {
      respondMobile(message.source, v4(), {});
      await doInit(message.source);
      // await doInit(message.source);
    } else {
      await doInit(message.source);
    }
    
    
  } else if (method == "login") {
    let {signedTransactionHex} = payload;
    if (!!!signedTransactionHex) {
    handleLogin(payload);
    }
  } else if (method == "storageGranted") {
    // console.log("lol");
    // document.getElementById("identity").classList.add("doHide");
    // document.getElementById("identity").classList.remove("doZ");
    // document.getElementById("identity").classList.remove("doBlock");
  } else if ( hasStorageAccess == false && browserSupported == true) {
    // document.getElementById("identity").classList.remove("doHide");
    // document.getElementById("identity").classList.add("doZ");
    // document.getElementById("identity").classList.add("doBlock");
    // console.log("lol");
    // let permissions = await navigator.permissions.query({name: 'persistent-storage'});
    // alert(JSON.stringify(permissions));
  } else if (browserSupported == false) {
      alert("This application will not work with this browser!");
      return;
  } else if ( "jwt" in payload) {
    handleJWT(payload);
  }
  
  // console.dir(message);
};
onMount(() => {
  let OS = getMobileOperatingSystem();

if (OS == "iOS") {
  isMobile = true;
  // document.getElementById("identity").classList.remove("hideMe");
}
window.addEventListener("message", windowEventListener);
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


const login = () => {
  if (isMobile == true) {
    // openTab(`https://identity.bitclout.com/log-in?accessLevelRequest=${accessLevel}`);
    identityWindow = window.open('https://identity.bitclout.com/log-in?accessLevelRequest='+ accessLevel, "_blank", 'toolbar=no, width=800, height=1000, top=0, left=0');

  } else {
    // alert("hmm");
    identityWindow = window.open('https://identity.bitclout.com/log-in?accessLevelRequest='+ accessLevel, null, 'toolbar=no, width=800, height=1000, top=0, left=0');
  }
}
export const handleEv = async () => {
  login();
};

toggleLogin.subscribe(ev => {
  if (isMobile == true && ev == true) {
    // alert("Thanks for inputting your key! Please click 'Login with BitClout' one more time.");
    mobileAuth.set(true);
    toggleLogin.set(false);
  } else if (ev == true) {
    handleEv();
    mobileAuth.set(true);
    toggleLogin.set(false);
  }
});


</script>
<svelte:head>
  <style>
    .doHide {
      display: none;
    }
    .doBlock {
      position: absolute;
      top: 0;
      left: 0;
      width 100%;
      height: 100%;
    }
    .doZ {
      z-index: 999;
    }
  </style>
</svelte:head>


<iframe
  title="bitCloutIdentity"
  id="identity"
  class="doHide"
  frameborder="0"
  src="https://identity.bitclout.com/embed"
  style="height: 100vh; width: 100vw;"
  
></iframe>
