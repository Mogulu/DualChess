function initPlayer(){

    var ref = firebase.database().ref('/players');
    ref.once("value",function(snapshot) {
        if (snapshot.hasChild(userId)) {
            console.log("alreadycreated0");
            return;
        }
    });

    // update database
    var data = {};
    data["elo"] = "1400";
    firebase.database().ref('/players/'+userId).update(data);
}