"use strict";
var userId;
var userName;
var nbQueen = 1;
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
            userName = user.displayName;

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

            //            document.getElementById("accout-details").textContent = JSON.stringify(user, null, "  ");

            initPlayer();
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
    document.getElementById("loby-button").addEventListener("click", goToLoby, false);


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

function initPlayer(){

    //check if player already exists
    var ref = firebase.database().ref('/players');
    ref.once("value",function(snapshot) {
        if (snapshot.hasChild(userId)) {
            console.log("alreadycreated");
        }
        else{
            // create database
            var data = {};
            data["elo"] = 1400;
            data["nickname"] = userName;
            data["status"] = "menu";
            data["win"] = 0;
            data["loose"] = 0;       
            firebase.database().ref('/players/'+userId).update(data);
            console.log("user created");
        }
    });
}


function goToLoby(){

    document.getElementById("chessboard").removeAttribute('hidden');
    //check if already in loby
    var ref = firebase.database().ref('/loby');
    ref.once("value",function(snapshot) {
        if (snapshot.hasChild(userId)) {
            console.log("already In Loby");
        }
        else{
            // update database
            var elo = {};    
            firebase.database().ref('/players/'+userId+'/elo/').once("value", function(snapshot) {
                elo = snapshot.val();
                console.log(elo);
            });
 
            var data = {};
            data["elo"] = elo;
            data["status"] = "waiting";   
            firebase.database().ref('/loby/'+userId).update(data);
            console.log("in loby");
        }
    });



}


// Launch function DualChess when the window is loaded
window.onload = function() {
    window.dualChess = new DualChess();

};