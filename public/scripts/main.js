"use strict";
var userId;
// Initialize Firebase
var config = {
    apiKey: "AIzaSyA_P-RNGkGLqqSzJvtf7mF-N3z8E4hAo8A",
    authDomain: "dualchess.firebaseapp.com",
    databaseURL: "https://dualchess.firebaseio.com",
    projectId: "dualchess",
    storageBucket: "dualchess.appspot.com",
    messagingSenderId: "155258817437"
};

firebase.initializeApp(config);
// Initializes DualChess
function DualChess(){
    // Checks that the Firebase SDK has been correctly setup and configured.
    if(!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options){
        window.alert("Firebase's SDK ERROR");
    }
    console.log("Firebase is not init");
    initFirebase();
    console.log("Firebase is init");
}

// Init Firebase
function initFirebase() {
    //START authstatelistener
    firebase.auth().onAuthStateChanged(function(user){
        if(user){
            userId = user.uid;

            //USER PART show user data
            document.getElementById("user-data").style.visibility = "visible";
            document.getElementById("username").textContent = user.displayName;
            document.getElementById("profile-pic").src = user.photoURL;
            // LOGOUT BUTTON
            document.getElementById("login-button").style.backgroundColor = "#d25b46";
            document.getElementById("span-login-button").textContent = "Log out";
            // user pic right corner
            document.getElementById("sign-in-status").src = user.photoURL;

            //mechanics
            document.getElementById("user-data").style.visibility = "visible";
            document.getElementById("game").style.visibility = "visible";
            document.getElementById("history").style.visibility = "visible";
            document.getElementById("invite-log-game").style.display = "none";
            document.getElementById("invite-log-history").style.display = "none";
            document.getElementById("chessboard").removeAttribute('hidden');

//            document.getElementById("accout-details").textContent = JSON.stringify(user, null, "  ");


        } else{
            //If not auth
            //invite login
            document.getElementById("login-button").style.backgroundColor = "#2ed19c";

            //hide some parts"
            document.getElementById("user-data").style.visibility = "hidden";
            document.getElementById("game").style.visibility = "hidden";
            document.getElementById("history").style.visibility = "hidden";
            //Display message login
            document.getElementById("invite-log-game").style.visibility = "visible";
            document.getElementById("invite-log-history").style.visibility = "visible";

            document.getElementById("span-login-button").textContent = "Log in";
            document.getElementById("sign-in-status").src = "../img/logout.png";
            document.getElementById("chessboard").style.display = "hidden";

        }
        document.getElementById("login-button").disabled = false;
    });
    // END authstatelistener
    document.getElementById("login-button").addEventListener("click", signInOut, false);
    
    new ChessGame();
}

// START the sign in process
function signInOut() {

    if(firebase.auth().currentUser){
        firebase.auth().signOut();
    } else{
        var provider = new firebase.auth.GoogleAuthProvider();
        //var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider);
    }
}

// Launch function DualChess when the window is loaded
window.onload = function() {
    window.dualChess = new DualChess();

};