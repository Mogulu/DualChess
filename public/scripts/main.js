"use strict";
var userId;
var opID;
var userName;
var nbQueen = 1;
var BEFOREGAME = false;
var BEFOREWIN = false;

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

    $(window).resize(function() {
        $( init );
        new ChessGame();
    });

    //START authstatelistener
    firebase.auth().onAuthStateChanged(function(user){
        if(user){

            userId = user.uid;
            userName = user.displayName;
            //USER PART show user data
            document.getElementById("user-data").style.visibility = "visible";
            document.getElementById("username").textContent = user.displayName;
            document.getElementById("profile-pic").src = user.photoURL;
            // user pic right corner
            document.getElementById("sign-in-status").src = user.photoURL;
            
            stats();
            initPlayer();
            connected();
        } else{
            //If not auth
            //invite login
            notConnected();


        }
        document.getElementById("login-button").disabled = false;
    });
    // END authstatelistener
    document.getElementById("login-button").addEventListener("click", signInOut, false);
    document.getElementById("loby-button").addEventListener("click", goToLoby, false);
    document.getElementById("game-button").addEventListener("click", Loose, false);


<<<<<<< HEAD


=======
>>>>>>> 6d1903108f5f9c7ed2c4377fad5a29dc9d1bf853
}

function connected(){


    // LOGOUT BUTTON
    document.getElementById("login-button").style.backgroundColor = "#d25b46";
    document.getElementById("span-login-button").textContent = "Log out";


    //mechanics
    document.getElementById("user-data").style.visibility = "visible";
    document.getElementById("game").style.visibility = "visible";
    document.getElementById("history").style.visibility = "visible";
    document.getElementById("invite-log-game").style.display = "none";
    document.getElementById("invite-log-history").style.display = "none";

    //document.getElementById("accout-details").textContent = JSON.stringify(user, null, "  ");

}

function notConnected(){
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
}

function inMenu(){
    //cancel button
    document.getElementById("loby-button").textContent = "Cancel Search";
    document.getElementById("spinner_loby").style.display = "block";
    document.getElementById("chessboard").style.visibility = "hidden"
    BEFOREGAME = false;
}

function afterGame(){
    //cancel button
    document.getElementById("loby-button").textContent = "Search Game";
    document.getElementById("spinner_loby").style.display = "none";
    document.getElementById("chessboard").style.visibility = "hidden"
    document.getElementById("loby-button").style.display = "block";
    document.getElementById("game-button").style.display = "none";
    BEFOREGAME = false;
    stats();
}

function inLoby(){
    document.getElementById("loby-button").textContent = "Search Game";
    document.getElementById("spinner_loby").style.display = "none";
}

function inGame(){
    document.getElementById("loby-button").textContent = "Cancel Game";
    document.getElementById("chessboard").style.visibility = "visible"
    document.getElementById("spinner_loby").style.display = "none";
}

// START the sign in process
function signInOut() {

    if(firebase.auth().currentUser){
        firebase.auth().signOut();
        //notConnected();
    } else{
        var provider = new firebase.auth.GoogleAuthProvider();
        //var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider);
        connected();
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


    //check if already in loby
    var ref = firebase.database().ref('/loby');
    ref.once("value",function(snapshot) {
        if (snapshot.hasChild(userId)) {
            console.log("already In Loby");
            snapshot.child(userId).ref.remove();
            console.log("removed from Loby");

            inLoby();
            var data_players = {};
            data_players["status"] = "menu";

        }
        else{
            // update database
            var elo = {};    
            firebase.database().ref('/players/'+userId+'/elo/').once("value", function(snapshot) {
                elo = snapshot.val();
            });

            var data_loby = {};
            data_loby["elo"] = elo;
            data_loby["status"] = "waiting";   
            firebase.database().ref('/loby/'+userId).update(data_loby);
            searchPlayer();

            var data_players = {};
            data_players["status"] = "loby";
            console.log("in loby");
            inMenu();

        }
    });
}

function stats(){
    var ref = firebase.database().ref('/players/'+userId)
    ref.once("value",function(snapshot){
        var win = snapshot.child("win").val();
        var loose = snapshot.child("loose").val();
        if(loose != 0){
            var ratio = win/loose;
            document.getElementById("stats_ratio").textContent = "Ratio WL : "+ratio.toFixed(2);
            document.getElementById("stats_elo").textContent = snapshot.child("elo").val();;

        }else{

        }

    });
}


function searchPlayer(){
    var ref = firebase.database().ref('/loby/'+userId);
    var key = null;
    ref.once('value',function(snapshot){
        key = snapshot.key;
        console.log(key);
    }); 

    var lobyListRef =  firebase.database().ref('/loby');
    lobyListRef.once("value",function(playerListSnapchot){

        var findPlayer = false
        playerListSnapchot.forEach(function(playerSnapshot){
            console.log(playerSnapshot.key + playerSnapshot.val());
            if(playerSnapshot.key != userId && findPlayer == false){
                console.log("on lance une game")
                playerSnapshot.ref.remove();
                playerListSnapchot.child(userId).ref.remove();
                findPlayer = true;

                var data_players = {};
                data_players["status"] = "inGame";

                opID = playerSnapshot.key;
                firebase.database().ref('/players/'+playerSnapshot.key).update(data_players);
                firebase.database().ref('/players/'+userId).update(data_players);

                Game();
                inGame();

                idGame = hashFnv32a(userId + playerListSnapchot.key, true);
                var ref2 = firebase.database().ref('/games');
                var key2 = null;
                ref2.once('value',function(snapshot){
                    if (snapshot.hasChild(idGame)) {
                        new ChessGame();
                        console.log("Game already created");
                    }
                    else{
                        new ChessGame();
                        // create database
                        var data = {}; 
                        data[idGame] = initDatabase;
                        data[idGame]["idBlack"] = playerSnapshot.key;
                        data[idGame]["idWhite"] = userId;

                        firebase.database().ref('/games').update(data);
                        console.log("user created");
                    }
                }); 


            }
            else{
                var ref = firebase.database().ref('/players/'+userId)
                ref.on("value",function(snapchot){
                    console.log("listener");    

                    if(BEFOREGAME == false)
                    {
                        console.log(BEFOREGAME+" init");
                        BEFOREGAME = true;
                    }else{
                        Game();
                        BEFOREGAME = false;
                        console.log("someone found me");
                    }
                    console.log(BEFOREGAME+" ref");


                });
                console.log("alone in loby or already find oppenent");

            }
        });
    });
}

function Game(){

    inGame();
    listenerWin();
    document.getElementById("loby-button").style.display = "none";
    document.getElementById("game-button").style.display = "block";


}

function Loose(){


    var ref = firebase.database().ref('/players/'+userId);
    ref.once("value",function(snapshot) {
        var loose = snapshot.child("loose").val() ;
        var data = {};
        data["status"] = "menu"; 
        data["loose"] = loose + 1;       

        firebase.database().ref('/players/'+userId).update(data);  

    });

    var refOp = firebase.database().ref('/players/'+userId);

    refOp.once("value",function(snapshot) {
        var win = snapshot.child("win").val() ;
        var data = {};
        data["status"] = "menu"; 
        data["win"] = win + 1;       

        firebase.database().ref('/players/'+opID).update(data);  

    });

    BEFOREGAME = false;
    afterGame();
}

function listenerWin(){


    var ref = firebase.database().ref('/players/'+userId+'/win')
    ref.on("value",function(snapshot){
        console.log("listener");    

        if(BEFOREWIN == false)
        {
            console.log(BEFOREWIN+" init");
            BEFOREWIN = true;
        }else{
            BEFOREWIN = false;
            console.log("someone found me");
        }
        console.log(BEFOREWIN+" ref");


    });


    afterGame();
}

function hashFnv32a(str, asString, seed) {
    /*jshint bitwise:false */
    var i, l,
        hval = (seed === undefined) ? 0x811c9dc5 : seed;

    for (i = 0, l = str.length; i < l; i++) {
        hval ^= str.charCodeAt(i);
        hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
    }
    if( asString ){
        // Convert to 8 digit hex string
        return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
    }
    return hval >>> 0;
}


// Launch function DualChess when the window is loaded
window.onload = function() {
    window.dualChess = new DualChess();

}