/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

var idGame;
var colorPlayer;
var userId;

// Initializes FriendlyChat.
function FriendlyChat() {
    this.checkSetup();

    // Shortcuts to DOM Elements.
    this.messageList = document.getElementById('messages');
    this.messageForm = document.getElementById('message-form');
    this.messageInput = document.getElementById('message');
    this.submitButton = document.getElementById('submit');
    this.submitImageButton = document.getElementById('submitImage');
    this.imageForm = document.getElementById('image-form');
    this.mediaCapture = document.getElementById('mediaCapture');
    this.userPic = document.getElementById('user-pic');
    this.userName = document.getElementById('user-name');
    this.signInButton = document.getElementById('sign-in');
    this.signOutButton = document.getElementById('sign-out');
    this.signInSnackbar = document.getElementById('must-signin-snackbar');
    this.messages = document.getElementById('messages-card-container');
    this.chessboard = document.getElementById('chessboard');

    // Saves message on form submit.
    this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.signInButton.addEventListener('click', this.signIn.bind(this));

    // Toggle for the button.
    var buttonTogglingHandler = this.toggleButton.bind(this);
    this.messageInput.addEventListener('keyup', buttonTogglingHandler);
    this.messageInput.addEventListener('change', buttonTogglingHandler);

    // Events for image upload.
    this.submitImageButton.addEventListener('click', function(e) {
        e.preventDefault();
        this.mediaCapture.click();
    }.bind(this));
    this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

    this.initFirebase();

    this.loadChessboard();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
FriendlyChat.prototype.initFirebase = function() {
    //Shortcuts to Firebase SDK features
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    
    //initiates Firebase auth and listen to auth state changes
    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));
};

// Loads chat messages history and listens for upcoming ones.
FriendlyChat.prototype.loadMessages = function() {
    // Reference to the /messages/database path
    this.messagesRef = this.database.ref('messages');
    // Make sure all previous listener are removed
    this.messagesRef.off();

    //loads the last 12 messages and listen for new ones.
        var setMessage = function(data){
            var val = data.val();
            this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl);
        }.bind(this);
        
        this.messagesRef.on('child_added', setMessage);
        this.messagesRef.on('child_changed', setMessage);
};

// Saves a new message on the Firebase DB.
FriendlyChat.prototype.saveMessage = function(e) {
    e.preventDefault();
    // Check that the user entered a message and is signed in.
    if (this.messageInput.value && this.checkSignedInWithMessage()) {
        var currentUser = this.auth.currentUser;
        // Add a new message entry to the Firebase Database.
        this.messagesRef.push({
        name: currentUser.displayName,
        text: this.messageInput.value,
        photoUrl: currentUser.photoURL || '/images/profile_placeholder.png'
        }).then(function() {
        // Clear message text field and SEND button state.
        FriendlyChat.resetMaterialTextfield(this.messageInput);
        this.toggleButton();
        }.bind(this)).catch(function(error) {
        console.error('Error writing new message to Firebase Database', error);
        });
    }
};

// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
FriendlyChat.prototype.setImageUrl = function(imageUri, imgElement) {
    imgElement.src = imageUri;

    // TODO(DEVELOPER): If image is on Cloud Storage, fetch image URL and set img element's src.
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
FriendlyChat.prototype.saveImageMessage = function(event) {
    event.preventDefault();
    var file = event.target.files[0];

    // Clear the selection in the file picker input.
    this.imageForm.reset();

    // Check if the file is an image.
    if (!file.type.match('image.*')) {
        var data = {
        message: 'You can only share images',
        timeout: 2000
        };
        this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
        return;
    }
    // Check if the user is signed-in
    if (this.checkSignedInWithMessage()) {

        // TODO(DEVELOPER): Upload image to Firebase storage and add message.

    }
};

// Signs-in Friendly Chat.
FriendlyChat.prototype.signIn = function() {
    //Sign in Firebase with credential from the Google user.
    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
    };

    // Signs-out of Friendly Chat.
    FriendlyChat.prototype.signOut = function() {

    this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
FriendlyChat.prototype.onAuthStateChanged = function(user) {
    if (user) { // User is signed in!
        userId = user.uid;
        // Get profile pic and user's name from the Firebase user object.
        var profilePicUrl = user.photoURL;
        var userName = user.displayName;

        // Set the user's profile pic and name.
        this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
        this.userName.textContent = userName;

        // Show user's profile and sign-out button.
        this.userName.removeAttribute('hidden');
        this.userPic.removeAttribute('hidden');
        this.signOutButton.removeAttribute('hidden');
        this.messages.removeAttribute('hidden');
        this.chessboard.removeAttribute('hidden');


        // Hide sign-in button.
        this.signInButton.setAttribute('hidden', 'true');

        // We load currently existing chant messages.
        this.loadMessages();

        // We save the Firebase Messaging Device token and enable notifications.
        this.saveMessagingDeviceToken();
    } else { // User is signed out!
        // Hide user's profile and sign-out button.
        this.userName.setAttribute('hidden', 'true');
        this.userPic.setAttribute('hidden', 'true');
        this.signOutButton.setAttribute('hidden', 'true');
        this.messages.setAttribute('hidden','true');
        this.chessboard.setAttribute('hidden','true');

        // Show sign-in button.
        this.signInButton.removeAttribute('hidden');
    }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
FriendlyChat.prototype.checkSignedInWithMessage = function() {
    /* TODO(DEVELOPER): Check if user is signed-in Firebase. */
        if (this.auth.currentUser){
            return true;
        }
        
    // Display a message to the user using a Toast.
    var data = {
        message: 'You must sign-in first',
        timeout: 2000
    };
    this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
    return false;
};

// Saves the messaging device token to the datastore.
FriendlyChat.prototype.saveMessagingDeviceToken = function() {
// TODO(DEVELOPER): Save the device token in the realtime datastore
};

// Requests permissions to show notifications.
FriendlyChat.prototype.requestNotificationsPermissions = function() {
// TODO(DEVELOPER): Request permissions to send notifications.
};

// Resets the given MaterialTextField.
FriendlyChat.resetMaterialTextfield = function(element) {
    element.value = '';
    element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
FriendlyChat.MESSAGE_TEMPLATE =
        '<div class="message-container">' +
        '<div class="spacing"><div class="pic"></div></div>' +
        '<div class="message"></div>' +
        '<div class="name"></div>' +
        '</div>';

// A loading image URL.
FriendlyChat.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
FriendlyChat.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
    var div = document.getElementById(key);
    // If an element for that message does not exists yet we create it.
    if (!div) {
        var container = document.createElement('div');
        container.innerHTML = FriendlyChat.MESSAGE_TEMPLATE;
        div = container.firstChild;
        div.setAttribute('id', key);
        this.messageList.appendChild(div);
    }
    if (picUrl) {
        div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
    }
    div.querySelector('.name').textContent = name;
    var messageElement = div.querySelector('.message');
    if (text) { // If the message is text.
        messageElement.textContent = text;
        // Replace all line breaks by <br>.
        messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
    } else if (imageUri) { // If the message is an image.
        var image = document.createElement('img');
        image.addEventListener('load', function() {
        this.messageList.scrollTop = this.messageList.scrollHeight;
        }.bind(this));
        this.setImageUrl(imageUri, image);
        messageElement.innerHTML = '';
        messageElement.appendChild(image);
    }
    // Show the card fading-in.
    setTimeout(function() {div.classList.add('visible')}, 1);
    this.messageList.scrollTop = this.messageList.scrollHeight;
    this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
FriendlyChat.prototype.toggleButton = function() {
    if (this.messageInput.value) {
        this.submitButton.removeAttribute('disabled');
    } else {
        this.submitButton.setAttribute('disabled', 'true');
    }
};

// Checks that the Firebase SDK has been correctly setup and configured.
FriendlyChat.prototype.checkSetup = function() {
    if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
        window.alert('You have not configured and imported the Firebase SDK. ' +
            'Make sure you go through the codelab setup instructions and make ' +
            'sure you are running the codelab using `firebase serve`');
    }
};

window.onload = function() {
    window.friendlyChat = new FriendlyChat();
};


// Load the chessboard initial
FriendlyChat.prototype.loadChessboard = function() {

    // database connexion
    var ref = firebase.database().ref('/games');
    
    // get datas back
    ref.on("value", function(snapshot) {
        idGame = Object.keys(snapshot.val())[0];
        colorPlayer = snapshot.val()[idGame]['colorPlayer'];

        pieceWhichAttackTheCase("E5", "B");

        var listPieces = findPieces();
        // remove all pieces
        for (var key in listPieces) 
        {
            // remove the piece
            $( "#" + key ).remove();
        }

        // place pieces
        for( var piece in listPieces )
        {
            if(listPieces[piece] != "")
            {
                $('<img src="../images/pieces/'+piece+'.png" id="'+ piece +'" style="z-index: 1; margin-top:-29%; height: 100%; width: 100%; ">').appendTo('#'+listPieces[piece]).draggable( {
                    containment: '#content',
                    revert: true
                } );

                if(userId = snapshot.val()[idGame]['id_black'])
                {
                    if(colorPlayer == 'white')
                    {
                        $("#"+piece).draggable( 'disable' );
                    }
                    else if(colorPlayer == 'black')
                    {
                        if(piece.charAt(0) == "W")
                            $("#"+piece).draggable( 'disable' );
                        else
                            $("#"+piece).draggable( 'unable' );
                    }
                }
                else if(userId = snapshot.val()[idGame]['id_white'])
                {
                    if(colorPlayer == 'black')
                    {
                        $("#"+piece).draggable( 'disable' );
                    }
                    else if(colorPlayer == 'white')
                    {
                        if(piece.charAt(0) == "B")
                            $("#"+piece).draggable( 'disable' );
                        else
                            $("#"+piece).draggable( 'unable' );
                    }
                }

                // Whene the mouse is on the piece, add class to put the piece in front of others
                $("#" + piece).mouseenter(function(){
                    $(this).addClass("z_index");
                    $('body').css('cursor', 'move');
                });
                $("#" + piece).mouseleave(function(){
                    $(this).removeClass("z_index");
                    $('body').css('cursor', 'default');
                });
            }
        }
    });

};

function findPieces() 
{
    var ref = firebase.database().ref('/games/'+idGame+'/pieces');
    var list;

    ref.once("value", function(snapshot) {
        list = snapshot.val();
    });

    return list;
}

function pieceDrop( event, ui ) 
{
    var ref = firebase.database().ref('/games/'+idGame+'/pieces');
    var newCase = $(this)[0].id;
    var pieceId = ui.draggable[0].id;
    var lastCase;
    var listPieces;
    
    ref.once("value", function(snapshot) {
        lastCase = snapshot.val()[pieceId];
    });

    if( lastCase != newCase)
    {
        var flagMoveOK = checkDeplacement(pieceId, lastCase, newCase);

        if(flagMoveOK == false)
        {
            return;
        }

        listPieces = findPieces();
        // get pieces position back
        for (var key in listPieces) 
        {
            if(listPieces[key] == newCase)
            {
                // remove the case and add its name
                $( "#" + key ).remove();
                
                var data = {};
                data[key] = "";
                firebase.database().ref('/games/'+idGame+'/pieces').update(data);
            }
        }

        // remove the case and add its name
        $( "#" + pieceId ).remove();

        var data = {};
        data[pieceId] = newCase;

        // update database
        firebase.database().ref('/games/'+idGame+'/pieces').update(data);

        data = {};
        if(colorPlayer == "white")
            data['colorPlayer'] = "black";
        else
            data['colorPlayer'] = "white";
        
        firebase.database().ref('/games/'+idGame).update(data);
    }

    ui.draggable.position( { of: $(this), my: 'left top', at: 'left top' } );
    ui.draggable.draggable( 'option', 'revert', false );
}

function checkDeplacement(pieceId, lastCase, newCase)
{
    var lastPos = nameCaseToPosition(lastCase);
    var newPos = nameCaseToPosition(newCase);

    var listPieces = findPieces();
    for (var key in listPieces) 
    {
        if(listPieces[key] == newCase && key.charAt(0) == pieceId.charAt(0))
        {
            return false;
        }
    }

    switch(pieceId.charAt(2))
    {
        case "R":
            if(lastPos[0] == newPos[0] || lastPos[1] == newPos[1])
            {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) 
                {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos
                    if(((pos[1] < newPos[1] && pos[1] > lastPos[1]) || 
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) || 
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) || 
                        (pos[0] > newPos[0] && pos[0] < lastPos[0]) ) && (pos[0] == newPos[0] || pos[1] == newPos[1]))
                    {
                        return false;
                    }
                }
                return true;
            }
            else
                return false;
            break;
        case "N":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            if((Math.abs(x)==1 && Math.abs(y)==2) || (Math.abs(x)==2 && Math.abs(y)==1))
            {
                return true;
            }
            else
                return false;
            break;
        case "B":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            if( Math.abs(x) == Math.abs(y) )
            {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) 
                {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos
                    if(((pos[1] < newPos[1] && pos[1] > lastPos[1]) || 
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) || 
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) || 
                        (pos[0] > newPos[0] && pos[0] < lastPos[0])) && ((Math.abs(pos[0] - newPos[0]) == Math.abs(pos[1] - newPos[1])) 
                                                                    && (Math.abs(pos[0] - lastPos[0]) == Math.abs(pos[1] - lastPos[1]))
                                                                )
                        )
                    {
                        return false;
                    }
                }
                return true;
            }
            else
                return false;
            break;
        case "K":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            if( Math.abs(x) <= 1 && Math.abs(y) <= 1)
            {
                return true;
            }
            else
                return false;
            break;
        case "Q":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            if(lastPos[0] == newPos[0] || lastPos[1] == newPos[1])
            {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) 
                {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos
                    if(((pos[1] < newPos[1] && pos[1] > lastPos[1]) || 
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) || 
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) || 
                        (pos[0] > newPos[0] && pos[0] < lastPos[0]) ) && (pos[0] == newPos[0] || pos[1] == newPos[1]))
                    {
                        return false;
                    }
                }
                return true;
            }
            else if( Math.abs(x) == Math.abs(y) )
            {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) 
                {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos
                    if(((pos[1] < newPos[1] && pos[1] > lastPos[1]) || 
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) || 
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) || 
                        (pos[0] > newPos[0] && pos[0] < lastPos[0])) && ((Math.abs(pos[0] - newPos[0]) == Math.abs(pos[1] - newPos[1])) 
                                                                    && (Math.abs(pos[0] - lastPos[0]) == Math.abs(pos[1] - lastPos[1]))
                                                                )
                        )
                    {
                        return false;
                    }
                }
                return true;
            }
            else
                return false;
            break;
        case "P":
            var color = pieceId.charAt(0);
            var x = newPos[0]-lastPos[0];
            var y = newPos[1]-lastPos[1];

            if(color == "B" && y >= -2 && y < 0)
            {
                if (y == -2 && lastCase[1] == 7)
                {
                    // check if a piece is between lastPos and newPos
                    for (var key in listPieces) 
                    {
                        var pos = nameCaseToPosition(listPieces[key])
                        // if a piece is between lastPos and newPos
                        if(pos[0] == newPos[0] && pos[1] == newPos[1] + 1)
                        {
                            return false;
                        }
                    }
                    return true;
                }
                else if (y == -1 && x == 0)
                {
                    // check if a piece is between lastPos and newPos
                    for (var key in listPieces) 
                    {
                        var pos = nameCaseToPosition(listPieces[key])
                        // if a piece is between lastPos and newPos
                        if(pos[0] == newPos[0] && pos[1] == newPos[1])
                        {
                            return false;
                        }
                    }
                    return true;
                }
                else if (y == -1 && (x == -1 || x == 1))
                {
                    // check if a piece is between lastPos and newPos
                    for (var key in listPieces) 
                    {
                        var pos = nameCaseToPosition(listPieces[key])
                        // if a piece is between lastPos and newPos
                        if(pos[0] == newPos[0] && pos[1] == newPos[1])
                        {
                            return true;
                        }
                    }
                    return false;
                }
                else
                    return false;
            }
            else if (color == "W" && y <= 2 && y > 0)
            {
                if (y == 2 && lastCase[1] == 2)
                {
                    // check if a piece is between lastPos and newPos
                    for (var key in listPieces) 
                    {
                        var pos = nameCaseToPosition(listPieces[key])
                        // if a piece is between lastPos and newPos
                        if(pos[0] == newPos[0] && pos[1] == newPos[1] - 1)
                        {
                            return false;
                        }
                    }
                    return true;
                }
                else if (y == 1 && x == 0)
                {
                    // check if a piece is between lastPos and newPos
                    for (var key in listPieces) 
                    {
                        var pos = nameCaseToPosition(listPieces[key])
                        // if a piece is between lastPos and newPos
                        if(pos[0] == newPos[0] && pos[1] == newPos[1])
                        {
                            return false;
                        }
                    }
                    return true;
                }
                else if (y == 1 && (x == -1 || x == 1))
                {
                    // check if a piece is between lastPos and newPos
                    for (var key in listPieces) 
                    {
                        var pos = nameCaseToPosition(listPieces[key])
                        // if a piece is between lastPos and newPos
                        if(pos[0] == newPos[0] && pos[1] == newPos[1])
                        {
                            return true;
                        }
                    }
                    return false;
                }
                else
                    return false;
            }
            else
                return false;

            break;
    }

    return true;
}

function nameCaseToPosition(nameCase)
{
    var pos = {};

    pos [0] = nameCase.charCodeAt(0) - 64;
    pos [1] = nameCase.charCodeAt(1) - 48;

    return pos;
}

function pieceWhichAttackTheCase(casePos, colorPiece)
{
    var listPieces = findPieces();
    var flagEchecs = 1;

    casePos = nameCaseToPosition(casePos);

    for (var key1 in listPieces) 
    {
        switch(key1.charAt(2))
        {
            case "R":
                flagEchecs = 1;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1])

                if((casePos[0] == posPieceEchecs[0] || casePos[1] == posPieceEchecs[1]) && colorPiece != key1.charAt(0))
                {
                    // check if a piece is between lastPos and newPos
                    for (var key2 in listPieces) 
                    {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2])
                        // if a piece is between lastPos and newPos
                        if(((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) || 
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) || 
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) || 
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0])) && 
                                        (posPieceBetween[0] == posPieceEchecs[0] || 
                                        posPieceBetween[1] == posPieceEchecs[1]))
                        {
                            console.log("Pas échecs");
                            flagEchecs = 0;
                        }
                    }

                    if(flagEchecs == 1)
                    {
                        console.log("ECHECS");
                        return true;
                    }
                }
                break;
            case "N":
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);
    
                if(((Math.abs(x)==1 && Math.abs(y)==2) || (Math.abs(x)==2 && Math.abs(y)==1)) && colorPiece != key1.charAt(0))
                {
                    console.log("ECHECS");
                    return true;
                }

                break;
            case "B":
                flagEchecs = 1;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);
    
                if( Math.abs(x) == Math.abs(y) && colorPiece != key1.charAt(0))
                {
                    // check if a piece is between lastPos and listPieces
                    for (var key2 in listPieces) 
                    {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2])
                        // if a piece is between lastPos and listPieces
                        if(((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) || 
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) || 
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) || 
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0])) && ((Math.abs(posPieceBetween[0] - posPieceEchecs[0]) == Math.abs(posPieceBetween[1] - posPieceEchecs[1])) 
                                                                        && (Math.abs(posPieceBetween[0] - casePos[0]) == Math.abs(posPieceBetween[1] - casePos[1]))
                                                                    )
                            )
                        {
                            console.log("Pas échecs");
                            flagEchecs = 0;
                        }
                    }
                    
                    if(flagEchecs == 1)
                    {
                        console.log("ECHECS");
                        return true;
                    }
                }
                break;
            // case "K":
            //     var x = (lastPos[0] - listPieces[key]);
            //     var y = (lastPos[1] - listPieces[key]);
    
            //     if( Math.abs(x) <= 1 && Math.abs(y) <= 1)
            //     {
            //         return true;
            //     }
            //     else
            //         return false;
            //     break;
            // case "Q":
            //     var x = (lastPos[0] - listPieces[key]);
            //     var y = (lastPos[1] - listPieces[key]);
    
            //     if(lastPos[0] == listPieces[key] || lastPos[1] == listPieces[key])
            //     {
            //         // check if a piece is between lastPos and listPieces
            //         for (var key in listPieces) 
            //         {
            //             var pos = nameCaseToPosition(listPieces[key])
            //             // if a piece is between lastPos and listPieces
            //             if(((pos[1] < listPieces[key] && pos[1] > lastPos[1]) || 
            //                 (pos[1] > listPieces[key] && pos[1] < lastPos[1]) || 
            //                 (pos[0] < listPieces[key] && pos[0] > lastPos[0]) || 
            //                 (pos[0] > listPieces[key] && pos[0] < lastPos[0]) ) && (pos[0] == listPieces[key] || pos[1] == listPieces[key]))
            //             {
            //                 return false;
            //             }
            //         }
            //         return true;
            //     }
            //     else if( Math.abs(x) == Math.abs(y) )
            //     {
            //         // check if a piece is between lastPos and listPieces
            //         for (var key in listPieces) 
            //         {
            //             var pos = nameCaseToPosition(listPieces[key])
            //             // if a piece is between lastPos and listPieces
            //             if(((pos[1] < listPieces[key] && pos[1] > lastPos[1]) || 
            //                 (pos[1] > listPieces[key] && pos[1] < lastPos[1]) || 
            //                 (pos[0] < listPieces[key] && pos[0] > lastPos[0]) || 
            //                 (pos[0] > listPieces[key] && pos[0] < lastPos[0])) && ((Math.abs(pos[0] - listPieces[key]) == Math.abs(pos[1] - listPieces[key])) 
            //                                                             && (Math.abs(pos[0] - lastPos[0]) == Math.abs(pos[1] - lastPos[1]))
            //                                                         )
            //                 )
            //             {
            //                 return false;
            //             }
            //         }
            //         return true;
            //     }
            //     else
            //         return false;
            //     break;
            // case "P":
            //     var color = pieceId.charAt(0);
            //     var x = listPieces[key]-lastPos[0];
            //     var y = listPieces[key]-lastPos[1];
    
            //     if(color == "B" && y >= -2 && y < 0)
            //     {
            //         if (y == -2 && lastCase[1] == 7)
            //         {
            //             // check if a piece is between lastPos and listPieces
            //             for (var key in listPieces) 
            //             {
            //                 var pos = nameCaseToPosition(listPieces[key])
            //                 // if a piece is between lastPos and listPieces
            //                 if(pos[0] == listPieces[key] && pos[1] == listPieces[key] + 1)
            //                 {
            //                     return false;
            //                 }
            //             }
            //             return true;
            //         }
            //         else if (y == -1 && x == 0)
            //         {
            //             // check if a piece is between lastPos and listPieces
            //             for (var key in listPieces) 
            //             {
            //                 var pos = nameCaseToPosition(listPieces[key])
            //                 // if a piece is between lastPos and listPieces
            //                 if(pos[0] == listPieces[key] && pos[1] == listPieces[key])
            //                 {
            //                     return false;
            //                 }
            //             }
            //             return true;
            //         }
            //         else if (y == -1 && (x == -1 || x == 1))
            //         {
            //             // check if a piece is between lastPos and listPieces
            //             for (var key in listPieces) 
            //             {
            //                 var pos = nameCaseToPosition(listPieces[key])
            //                 // if a piece is between lastPos and listPieces
            //                 if(pos[0] == listPieces[key] && pos[1] == listPieces[key])
            //                 {
            //                     return true;
            //                 }
            //             }
            //             return false;
            //         }
            //         else
            //             return false;
            //     }
            //     else if (color == "W" && y <= 2 && y > 0)
            //     {
            //         if (y == 2 && lastCase[1] == 2)
            //         {
            //             // check if a piece is between lastPos and listPieces
            //             for (var key in listPieces) 
            //             {
            //                 var pos = nameCaseToPosition(listPieces[key])
            //                 // if a piece is between lastPos and listPieces
            //                 if(pos[0] == listPieces[key] && pos[1] == listPieces[key] - 1)
            //                 {
            //                     return false;
            //                 }
            //             }
            //             return true;
            //         }
            //         else if (y == 1 && x == 0)
            //         {
            //             // check if a piece is between lastPos and listPieces
            //             for (var key in listPieces) 
            //             {
            //                 var pos = nameCaseToPosition(listPieces[key])
            //                 // if a piece is between lastPos and listPieces
            //                 if(pos[0] == listPieces[key] && pos[1] == listPieces[key])
            //                 {
            //                     return false;
            //                 }
            //             }
            //             return true;
            //         }
            //         else if (y == 1 && (x == -1 || x == 1))
            //         {
            //             // check if a piece is between lastPos and listPieces
            //             for (var key in listPieces) 
            //             {
            //                 var pos = nameCaseToPosition(listPieces[key])
            //                 // if a piece is between lastPos and listPieces
            //                 if(pos[0] == listPieces[key] && pos[1] == listPieces[key])
            //                 {
            //                     return true;
            //                 }
            //             }
            //             return false;
            //         }
            //         else
            //             return false;
            //     }
            //     else
            //         return false;
    
            //     break;
        }
    }
    return true;
}