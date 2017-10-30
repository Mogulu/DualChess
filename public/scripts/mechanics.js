'use strict';

// Initializes ChessGame.
function ChessGame() {

    //shortcut
    this.chessboard = document.getElementById('chessboard');

    this.loadChessboard();
}

// Load the chessboard initial
ChessGame.prototype.loadChessboard = function () {

    // database connexion
    var ref = firebase.database().ref('/games');

    // get datas back
    ref.on("value", function (snapshot) {
        if(!idGame)
            return;

        colorPlayer = snapshot.val()[idGame]['colorPlayer'];

        // Find all pieces
        var listPieces = findPieces();
        // remove all pieces
        for (var key in listPieces) {
            // remove the piece
            $("#" + key).remove();
        }

        // place pieces one by one
        for (var piece in listPieces) {
            // if piece have a case
            if (listPieces[piece] != "") {
                // add image of the piece
                $('<img src="../img/pieces/' + piece + '.png" id="' + piece + '" class=\'piece\'>').appendTo('#' + listPieces[piece]).draggable({
                    containment: '#content',
                    revert: true
                });
                // if we have black
                if (userId == snapshot.val()[idGame]['idBlack']) {
                    // if white to move
                    if (colorPlayer == 'white') {
                        // make all pieces not draggable
                        $("#" + piece).draggable('disable');
                    }
                    // else if black to move
                    else if (colorPlayer == 'black') {
                        // make white pieces not draggable and black pieces draggable
                        if (piece.charAt(0) == "W")
                            $("#" + piece).draggable('disable');
                        else
                            $("#" + piece).draggable('unable');
                    }
                }
                // else if we have white make the same thing
                else if (userId == snapshot.val()[idGame]['idWhite']) {
                    if (colorPlayer == 'black') {
                        $("#" + piece).draggable('disable');
                    }
                    else if (colorPlayer == 'white') {
                        if (piece.charAt(0) == "B")
                            $("#" + piece).draggable('disable');
                        else
                            $("#" + piece).draggable('unable');
                    }
                }

                // Whene the mouse is on the piece, add class to put the piece in front of others
                $("#" + piece).mouseenter(function () {
                    $(this).addClass("z_index");
                    $('body').css('cursor', 'move');
                });
                $("#" + piece).mouseleave(function () {
                    $(this).removeClass("z_index");
                    $('body').css('cursor', 'default');
                });
            }
        }
    });

};

// Function which return the list of pieces and their position
function findPieces() {
    // database connexion
    var ref = firebase.database().ref('/games/' + idGame + '/pieces');
    var list;

    // get data
    ref.once("value", function (snapshot) {
        list = snapshot.val();
    });

    return list;
}

// Function call when a piece is drop
function pieceDrop(event, ui) {

    var newCase = $(this)[0].id;
    var pieceId = ui.draggable[0].id;

    var colorPiece = pieceId.charAt(0);
    var colorOponnent;
    if(colorPiece == "W")
        colorOponnent = "B";
    else
        colorOponnent = "W";

    var listPieces = findPieces();
    var lastCase = listPieces[pieceId];

    var data = {};

    // if the piece move
    if (lastCase != newCase) {

        // check if the movement is possible 
        var flagMoveOK = checkDeplacement(pieceId, lastCase, newCase);
        if (flagMoveOK == false)
            return;

        // get pieces position back
        for (var key in listPieces) {
            if (listPieces[key] == newCase) {
                // remove the piece
                $("#" + key).remove();

                data = {};
                data[key] = "";
                // update database
                firebase.database().ref('/games/' + idGame + '/pieces').update(data);
            }
        }

        data = {};
        // if pawn is promot
        if (flagMoveOK == "promot") {
            // add a queen
            data[pieceId.charAt(0) + "_Q" + nbQueen] = newCase;
            nbQueen++;
            // remove the piece
            data[pieceId] = "";
        }
        else
            data[pieceId] = newCase;

        // update database
        firebase.database().ref('/games/' + idGame + '/pieces').update(data);

        data = {};
        // update color player
        if (colorPlayer == "white")
            data['colorPlayer'] = "black";
        else
            data['colorPlayer'] = "white";

        firebase.database().ref('/games/' + idGame).update(data);

        //check if is Stalemate
        var flag = checkStalemate(listPieces[ colorOponnent + "_K"], colorOponnent);
        if (flag == true){
            console.log("Slatemate !!!");
            return;
        }
        else{
            console.log("Not Slatemate");
        }

        //check if is checkmate
        var flag = checkCheckMat(listPieces[ colorOponnent + "_K"], colorOponnent);
        if (flag == true)
        {
            Loose();
            return;
        }
        else
            console.log("Not checkmate");
    }

    ui.draggable.position({ of: $(this), my: 'left top', at: 'left top' });
    ui.draggable.draggable('option', 'revert', false);
}

// Check if movement is possible
function checkDeplacement(pieceId, lastCase, newCase) {
    var lastPos = nameCaseToPosition(lastCase);
    var newPos = nameCaseToPosition(newCase);

    var listPieces = findPieces();

    // check if piece don't eat a piece which has the same color
    for (var key in listPieces) {
        if (listPieces[key] == newCase && key.charAt(0) == pieceId.charAt(0)) {
            return false;
        }
    }

    // if the piece is not the king
    if (pieceId.charAt(2) != "K") {
        // check if the king is not check after the movement
        if (pieceWhichAttackTheCase(nameCaseToPosition(listPieces[pieceId.charAt(0) + "_K"]), pieceId.charAt(0), pieceId, newCase) != false) {
            return false;
        }
    }
    // else (the king move)
    else {
        // check if the king is not check after his movement
        if (pieceWhichAttackTheCase(newPos, pieceId.charAt(0), pieceId, newCase) != false) {
            return false;
        }
    }

    // rules to move
    switch (pieceId.charAt(2)) {

        // if it's a rook
        case "R":
            // if it moves vertically or horizontally
            if (lastPos[0] == newPos[0] || lastPos[1] == newPos[1]) {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos (not possible to move)
                    if (((pos[1] < newPos[1] && pos[1] > lastPos[1]) ||
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) ||
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) ||
                        (pos[0] > newPos[0] && pos[0] < lastPos[0])) && (pos[0] == newPos[0] || pos[1] == newPos[1])) {
                        return false;
                    }
                }
                
                // update pieceMove
                var data = {};
                data[pieceId] = true;
                firebase.database().ref('/games/' + idGame + '/piecesMove').update(data);
                return true;
            }
            // not possible
            else
                return false;
            break;

        // if it's knight
        case "N":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            // if it move like an "L"
            if ((Math.abs(x) == 1 && Math.abs(y) == 2) || (Math.abs(x) == 2 && Math.abs(y) == 1)) {
                return true;
            }
            else
                return false;
            break;

        // if it's a bishop
        case "B":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            // if it move diagonally
            if (Math.abs(x) == Math.abs(y)) {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos (not possible to move)
                    if (((pos[1] < newPos[1] && pos[1] > lastPos[1]) ||
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) ||
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) ||
                        (pos[0] > newPos[0] && pos[0] < lastPos[0])) && ((Math.abs(pos[0] - newPos[0]) == Math.abs(pos[1] - newPos[1]))
                            && (Math.abs(pos[0] - lastPos[0]) == Math.abs(pos[1] - lastPos[1]))
                        )
                    ) {
                        return false;
                    }
                }
                return true;
            }
            // else impossible to move
            else
                return false;
            break;

        // if it's a king
        case "K":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            // if king go one case around him (move possible)
            if (Math.abs(x) <= 1 && Math.abs(y) <= 1) {
                var data = {};
                data[pieceId] = true;
                firebase.database().ref('/games/' + idGame + '/piecesMove').update(data);
                return true;
            }
            // if it's rock
            else if (Math.abs(x) == 2 && Math.abs(y) == 0) {
                // get piece which have already move
                var ref = firebase.database().ref('/games/' + idGame + '/piecesMove');
                var listPieceMove;
                ref.once("value", function (snapshot) {
                    listPieceMove = snapshot.val();
                });

                var data = {};
                var pieceMoveData = {};

                // check the four check possible (small and big rock for black and white)
                // if king and the rook have'nt move and check if the king don't pass in a case which is check
                if (pieceId.charAt(0) == "B" && lastCase == "E8" && listPieces["B_R2"] == "H8" && listPieceMove["B_K"] == false && listPieceMove["B_R2"] == false) {
                    if (pieceWhichAttackTheCase(nameCaseToPosition("F8"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("G8"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("E8"), pieceId.charAt(0), pieceId, newCase) != false)
                        return false;
                    else {
                        data["B_R2"] = "F8";
                        pieceMoveData["B_K"] = true;
                        pieceMoveData["B_R2"] = true;
                    }
                }
                else if (pieceId.charAt(0) == "B" && lastCase == "E8" && listPieces["B_R1"] == "A8" && listPieceMove["B_K"] == false && listPieceMove["B_R1"] == false) {
                    if (pieceWhichAttackTheCase(nameCaseToPosition("D8"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("C8"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("E8"), pieceId.charAt(0), pieceId, newCase) != false)
                        return false;
                    else {
                        data["B_R1"] = "D8";
                        pieceMoveData["B_K"] = true;
                        pieceMoveData["B_R1"] = true;
                    }
                }
                else if (pieceId.charAt(0) == "W" && lastCase == "E1" && listPieces["W_R2"] == "H1" && listPieceMove["W_K"] == false && listPieceMove["W_R2"] == false) {
                    if (pieceWhichAttackTheCase(nameCaseToPosition("E1"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("F1"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("G1"), pieceId.charAt(0), pieceId, newCase) != false)
                        return false;
                    else {
                        data["W_R2"] = "F1";
                        pieceMoveData["W_K"] = true;
                        pieceMoveData["W_R2"] = true;
                    }
                }
                else if (pieceId.charAt(0) == "W" && lastCase == "E1" && listPieces["W_R1"] == "A1" && listPieceMove["W_K"] == false && listPieceMove["W_R1"] == false) {
                    if (pieceWhichAttackTheCase(nameCaseToPosition("E1"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("D1"), pieceId.charAt(0), pieceId, newCase) != false ||
                        pieceWhichAttackTheCase(nameCaseToPosition("C1"), pieceId.charAt(0), pieceId, newCase) != false)
                        return false;
                    else {
                        data["W_R1"] = "D1";
                        pieceMoveData["W_K"] = true;
                        pieceMoveData["W_R1"] = true;
                    }
                }
                else
                    return false;

                // update database
                firebase.database().ref('/games/' + idGame + '/pieces').update(data);
                firebase.database().ref('/games/' + idGame + '/piecesMove').update(pieceMoveData);

                return true;
            }
            else
                return false;
            break;

        // if it's a queen
        case "Q":
            var x = (lastPos[0] - newPos[0]);
            var y = (lastPos[1] - newPos[1]);

            // if queen move like a rook
            if (lastPos[0] == newPos[0] || lastPos[1] == newPos[1]) {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos
                    if (((pos[1] < newPos[1] && pos[1] > lastPos[1]) ||
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) ||
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) ||
                        (pos[0] > newPos[0] && pos[0] < lastPos[0])) && (pos[0] == newPos[0] || pos[1] == newPos[1])) {
                        return false;
                    }
                }
                return true;
            }
            // else if it move like a bishop
            else if (Math.abs(x) == Math.abs(y)) {
                // check if a piece is between lastPos and newPos
                for (var key in listPieces) {
                    var pos = nameCaseToPosition(listPieces[key])
                    // if a piece is between lastPos and newPos
                    if (((pos[1] < newPos[1] && pos[1] > lastPos[1]) ||
                        (pos[1] > newPos[1] && pos[1] < lastPos[1]) ||
                        (pos[0] < newPos[0] && pos[0] > lastPos[0]) ||
                        (pos[0] > newPos[0] && pos[0] < lastPos[0])) && ((Math.abs(pos[0] - newPos[0]) == Math.abs(pos[1] - newPos[1]))
                            && (Math.abs(pos[0] - lastPos[0]) == Math.abs(pos[1] - lastPos[1]))
                        )
                    ) {
                        return false;
                    }
                }
                return true;
            }
            else
                return false;
            break;
        
        // if it's a pawn
        case "P":
            var color = pieceId.charAt(0);
            var x = newPos[0] - lastPos[0];
            var y = newPos[1] - lastPos[1];

            // if it's black pawn
            if (color == "B" && y >= -2 && y < 0) {
                // if the pawn advance to two case and it is in his initial position
                if (y == -2 && lastCase[1] == 7) {
                    // check if a piece is not between or in the newPos
                    for (var key in listPieces) {
                        var pos = nameCaseToPosition(listPieces[key])
                        if (pos[0] == newPos[0] && pos[1] == newPos[1] + 1) {
                            return false;
                        }
                    }
                    return true;
                }
                // else if the pawn advance to one case
                else if (y == -1 && x == 0) {
                    // check if a piece is in the newPos
                    for (var key in listPieces) {
                        var pos = nameCaseToPosition(listPieces[key])
                        if (pos[0] == newPos[0] && pos[1] == newPos[1]) {
                            return false;
                        }
                    }
                    // if it's a promotion
                    if (newPos[1] == 1)
                        return "promot";

                    return true;
                }
                // else if the pawn eat another piece
                else if (y == -1 && (x == -1 || x == 1)) {
                    // check if ther is a piece in the newPos
                    for (var key in listPieces) {
                        var pos = nameCaseToPosition(listPieces[key])
                        if (pos[0] == newPos[0] && pos[1] == newPos[1]) {
                            // if it's promot
                            if (newPos[1] == 1)
                                return "promot";
                            return true;
                        }
                    }
                    return false;
                }
                else
                    return false;
            }
            // else if a white pawn, same thing but inversed
            else if (color == "W" && y <= 2 && y > 0) {
                if (y == 2 && lastCase[1] == 2) {
                    for (var key in listPieces) {
                        var pos = nameCaseToPosition(listPieces[key])
                        if (pos[0] == newPos[0] && pos[1] == newPos[1] - 1) {
                            return false;
                        }
                    }
                    return true;
                }
                else if (y == 1 && x == 0) {
                    for (var key in listPieces) {
                        var pos = nameCaseToPosition(listPieces[key])
                        if (pos[0] == newPos[0] && pos[1] == newPos[1]) {
                            return false;
                        }
                    }

                    if (newPos[1] == 8)
                        return "promot";

                    return true;
                }
                else if (y == 1 && (x == -1 || x == 1)) {
                    for (var key in listPieces) {
                        var pos = nameCaseToPosition(listPieces[key])
                        if (pos[0] == newPos[0] && pos[1] == newPos[1]) {
                            if (newPos[1] == 8)
                                return "promot";

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

// Transform a name case to a postion (B3 -> {2;3})
function nameCaseToPosition(nameCase) {
    var pos = {};
    pos[0] = nameCase.charCodeAt(0) - 64;
    pos[1] = nameCase.charCodeAt(1) - 48;

    return pos;
}

// Transform a position to a name of his case ({2;3} -> B3)
function namePositionToCase(Pos) {
    return String.fromCharCode(Pos[0] + 64) + Pos[1];
}

// Check if a case is attacked or not (use to see if it's possible to move a piece in this case)
function pieceWhichAttackTheCase(casePos, colorPiece, newPiece = "", newPos = "", pieceEsclusion = "") {
    var listPieces = findPieces();
    // if a piece is moved
    if (newPiece != "") {
        // change virtually the position
        listPieces[newPiece] = newPos;
    }

    var flagEchecs = true;

    // for all pieces we will check if it attack the case
    for (var key1 in listPieces) {

        // if the piece is eat
        if (newPos == listPieces[key1] && newPiece != key1) {
            listPieces[key1] = "";
        }

        switch (key1.charAt(2)) {
            // if it's a rook
            case "R":
                flagEchecs = true;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                // check if the rook is in the same line or column and it's the adverse color
                if ((casePos[0] == posPieceEchecs[0] || casePos[1] == posPieceEchecs[1]) && colorPiece != key1.charAt(0)) {
                    // check if a piece is between lastPos and newPos
                    for (var key2 in listPieces) {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2])
                        // if a piece is between lastPos and newPos
                        if (((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) ||
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) ||
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) ||
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0])) &&
                            (posPieceBetween[0] == posPieceEchecs[0] ||
                                posPieceBetween[1] == posPieceEchecs[1])) {
                            flagEchecs = false;
                        }
                    }
                    // if check return the piece which make check
                    if (flagEchecs == true) {
                        console.log("ECHECS");
                        return key1;
                    }
                }
                break;
            
            // if it's a knight
            case "N":
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);

                // if the knight attack the case return the pieceId
                if (((Math.abs(x) == 1 && Math.abs(y) == 2) || (Math.abs(x) == 2 && Math.abs(y) == 1)) && colorPiece != key1.charAt(0)) {
                    console.log("ECHECS");
                    return key1;
                }
                break;

            // if it's a bishop
            case "B":
                flagEchecs = true;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);

                // if the bishop attack the case
                if (Math.abs(x) == Math.abs(y) && colorPiece != key1.charAt(0)) {
                    // check if a piece is between lastPos and listPieces
                    for (var key2 in listPieces) {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2]);
                        // if a piece is between lastPos and listPieces
                        if (((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) ||
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) ||
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) ||
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0]))
                            && ((Math.abs(posPieceBetween[0] - posPieceEchecs[0]) == Math.abs(posPieceBetween[1] - posPieceEchecs[1]))
                                && (Math.abs(posPieceBetween[0] - casePos[0]) == Math.abs(posPieceBetween[1] - casePos[1])))
                        ) {
                            flagEchecs = false;
                        }
                    }

                    // if the bishop attack the case return his id
                    if (flagEchecs == true) {
                        console.log("ECHECS");
                        return key1;
                    }
                }
                break;
            
            // if it's a king
            case "K":
                // if he is exclude pass to an other piece (use if the king can't eat a piece)
                if (pieceEsclusion == key1)
                    break;

                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);

                // check if it can move
                if (Math.abs(x) <= 1 && Math.abs(y) <= 1 && colorPiece != key1.charAt(0)) {
                    console.log("ECHECS");
                    return key1;
                }
                break;

            // if it's a queen
            case "Q":
                flagEchecs = true;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);
                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);

                // check if it can attack moving like rook
                if ((casePos[0] == posPieceEchecs[0] || casePos[1] == posPieceEchecs[1]) && colorPiece != key1.charAt(0)) {
                    // check if a piece is between lastPos and newPos
                    for (var key2 in listPieces) {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2])
                        // if a piece is between lastPos and newPos
                        if (((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) ||
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) ||
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) ||
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0])) &&
                            (posPieceBetween[0] == posPieceEchecs[0] ||
                                posPieceBetween[1] == posPieceEchecs[1])) {
                            flagEchecs = false;
                        }
                    }

                    if (flagEchecs == true) {
                        console.log("ECHECS");
                        return key1;
                    }
                }
                // check if it can attack like bishop
                else if (Math.abs(x) == Math.abs(y) && colorPiece != key1.charAt(0)) {
                    // check if a piece is between lastPos and listPieces
                    for (var key2 in listPieces) {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2])
                        // if a piece is between lastPos and listPieces
                        if (((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) ||
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) ||
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) ||
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0]))
                            && ((Math.abs(posPieceBetween[0] - posPieceEchecs[0]) == Math.abs(posPieceBetween[1] - posPieceEchecs[1]))
                                && (Math.abs(posPieceBetween[0] - casePos[0]) == Math.abs(posPieceBetween[1] - casePos[1])))
                        ) {
                            flagEchecs = false;
                        }
                    }

                    if (flagEchecs == true) {
                        console.log("ECHECS");
                        return key1;
                    }
                }
                break;

            // if it's a pawn
            case "P":
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);

                // check if it can eat
                if (colorPiece != key1.charAt(0) && (x == 1 || x == -1) && (y == 1 || y == -1)) {
                    console.log("ECHECS");
                    return key1;
                }
                break;
        }
    }
    return false;
}

// Check if the king is checkmat
function checkCheckMat(kingCase, colorPiece) {
    var colorOpponent;
    if (colorPiece == "B")
        colorOpponent = "W";
    else
        colorOpponent = "B";

    var newKingPos = {};

    // check if the king is check, if is not it's not a checkmate
    var kingPos = nameCaseToPosition(kingCase);
    var pieceCheck = pieceWhichAttackTheCase(kingPos, colorPiece);
    if (!pieceCheck)
        return false;

    // if the king can move, it's not checkmate
    for (var i = -1; i <= 1; i++) {
        if (kingPos[0] + i > 0 && kingPos[0] + i < 9) {
            for (var j = -1; j <= 1; j++) {
                if (kingPos[1] + j > 0 && kingPos[1] + j < 9) {
                    newKingPos[0] = kingPos[0] + i;
                    newKingPos[1] = kingPos[1] + j;
                    if (checkDeplacement(colorPiece + "_K", kingCase, namePositionToCase(newKingPos)) != false) {
                        pieceCheck = pieceWhichAttackTheCase(newKingPos, colorPiece);
                        if (!pieceCheck)
                            return false;
                    }
                }
            }
        }
    }

    var listPieces = findPieces();

    // check if we can make a piece between the king and the opponent piece
    switch (pieceCheck.charAt(2)) {
        // if the opponent is a rook
        case "R":
            var posPieceCheck = nameCaseToPosition(listPieces[pieceCheck]);

            // if the rook is placed in the same column and a line < than the king
            if (posPieceCheck[0] == kingPos[0]) {
                if (posPieceCheck[1] < kingPos[1]) {
                    // check if we can place a piece between
                    for (var i = posPieceCheck[1]; i < kingPos[1]; i++) {
                        var casePos = {};
                        casePos[0] = posPieceCheck[0];
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        // if a piece can go check if it can move
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false) {
                                return false;
                            }
                            // else if it can't and it's the king, double check without the king
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                // same thing but with the rook in another place
                else {
                    for (var i = kingPos[1]; i < posPieceCheck[1]; i++) {
                        var casePos = {};
                        casePos[0] = posPieceCheck[0];
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }
            // same thing but with the rook in another place
            else if (posPieceCheck[1] == kingPos[1]) {
                if (posPieceCheck[0] < kingPos[0]) {
                    for (var i = posPieceCheck[0]; i < kingPos[0]; i++) {
                        var casePos = {};
                        casePos[1] = posPieceCheck[1];
                        casePos[0] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                // same thing but with the rook in another place
                else {
                    for (var i = kingPos[0]; i < posPieceCheck[0]; i++) {
                        var casePos = {};
                        casePos[1] = posPieceCheck[1];
                        casePos[0] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }

            break;

        // if it's a pawn or a knight check if we can it them
        case "N":
        case "P":
            var casePos = nameCaseToPosition(listPieces[pieceCheck]);
            var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
            if (pieceCanGo != false) {
                var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                if (flag != false)
                    return false;
                else if (flag == false && pieceCanGo == colorPiece + "_K") {
                    pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                    if (pieceCanGo != false) {
                        flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                        if (flag != false)
                            return false;
                    }
                }
            }

            break;

        // if it's a bishop check we can eat them or place a piece between
        case "B":
            var posPieceCheck = nameCaseToPosition(listPieces[pieceCheck]);

            var j = 0;

            // same thing that the rook but with a bishop
            if (posPieceCheck[0] < kingPos[0]) {
                if (posPieceCheck[1] < kingPos[1]) {
                    for (var i = posPieceCheck[1]; i < kingPos[1]; i++) {
                        j++;
                        var casePos = {};
                        casePos[0] = posPieceCheck[0] + j;
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                else {
                    for (var i = kingPos[1]; i < posPieceCheck[1]; i++) {
                        j--;
                        var casePos = {};
                        casePos[0] = posPieceCheck[0] + j;
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }
            else if (posPieceCheck[0] > kingPos[0]) {
                if (posPieceCheck[1] < kingPos[1]) {
                    for (var i = posPieceCheck[1]; i < kingPos[1]; i++) {
                        j++;
                        var casePos = {};
                        casePos[0] = posPieceCheck[0] + j;
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                else {
                    for (var i = kingPos[1]; i < posPieceCheck[1]; i++) {
                        j--;
                        var casePos = {};
                        casePos[0] = posPieceCheck[0] + j;
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }

            break;

        // if it's queen, same thing that the rook and the bishop
        case "Q":
            var posPieceCheck = nameCaseToPosition(listPieces[pieceCheck]);

            var j = 0;

            if (posPieceCheck[0] == kingPos[0]) {
                if (posPieceCheck[1] < kingPos[1]) {
                    for (var i = posPieceCheck[1]; i < kingPos[1]; i++) {
                        var casePos = {};
                        casePos[0] = posPieceCheck[0];
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                else {
                    for (var i = kingPos[1]; i < posPieceCheck[1]; i++) {
                        var casePos = {};
                        casePos[0] = posPieceCheck[0];
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;
                                }
                            }
                        }
                    }
                }
            }
            else if (posPieceCheck[1] == kingPos[1]) {
                if (posPieceCheck[0] < kingPos[0]) {
                    for (var i = posPieceCheck[0]; i < kingPos[0]; i++) {
                        var casePos = {};
                        casePos[1] = posPieceCheck[1];
                        casePos[0] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));

                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                else {
                    for (var i = kingPos[0]; i < posPieceCheck[0]; i++) {
                        var casePos = {};
                        casePos[1] = posPieceCheck[1];
                        casePos[0] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }
            else if (posPieceCheck[0] < kingPos[0]) {
                if (posPieceCheck[1] < kingPos[1]) {
                    for (var i = posPieceCheck[1]; i < kingPos[1]; i++) {
                        j++;
                        var casePos = {};
                        casePos[0] = posPieceCheck[0] + j;
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                else {
                    for (var i = kingPos[1]; i < posPieceCheck[1]; i++) {
                        j--;
                        var casePos = {};
                        casePos[0] = posPieceCheck[0] + j;
                        casePos[1] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }
            else if (posPieceCheck[1] > kingPos[1]) {
                if (posPieceCheck[0] < kingPos[0]) {
                    for (var i = posPieceCheck[0]; i < kingPos[0]; i++) {
                        j++;
                        var casePos = {};
                        casePos[1] = posPieceCheck[1] + j;
                        casePos[0] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
                else {
                    for (var i = kingPos[0]; i < posPieceCheck[0]; i++) {
                        j--;
                        var casePos = {};
                        casePos[1] = posPieceCheck[1] + j;
                        casePos[0] = i;
                        var pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent);
                        if (pieceCanGo != false) {
                            var flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                            if (flag != false)
                                return false;
                            else if (flag == false && pieceCanGo == colorPiece + "_K") {
                                pieceCanGo = pieceWhichAttackTheCase(casePos, colorOpponent, "", "", colorPiece + "_K");
                                if (pieceCanGo != false) {
                                    flag = checkDeplacement(pieceCanGo, listPieces[pieceCanGo], namePositionToCase(casePos));
                                    if (flag != false)
                                        return false;

                                }
                            }
                        }
                    }
                }
            }
            break;
    }

    console.log("Checkmate !!!");
    return true;
}

// Check if the king is stalemate (pat)
function checkStalemate(kingCase, colorPiece){

    var colorOpponent;
    if (colorPiece == "B")
        colorOpponent = "W";
    else
        colorOpponent = "B";

    var newKingPos = {};
    var newPos = {};

    var flagBlackKnight = 0;
    var flagBlackBishop = 0;
    var flagWhiteKnight = 0;
    var flagWhiteBishop = 0;
    var flagOponnentPiece = 0;
    var nbPieceOut = 0;

    var listPieces = findPieces();

    // check if there is sufisally piece to checkmate
    for (var key in listPieces) {
        if(key.charAt(0) == colorPiece && listPieces[key] != ""){
            switch (key.charAt(2)) {
                case "Q":
                case "R":
                case "P":
                    return false;
                    break;
                case "B":
                    if(flagBlackBishop == 1 || flagBlackKnight == 1)
                        return false;
                    else
                        flagBlackBishop++;
                    break;
                case "N":
                    if(flagBlackBishop == 1 || flagBlackKnight == 1)
                        return false;
                    else
                        flagBlackKnight++;
                    break;
            }
        }
        else if(key.charAt(0) == colorOpponent && listPieces[key] != ""){
            switch (key.charAt(2)) {
                case "Q":
                case "R":
                case "P":
                    flagOponnentPiece++;
                    break;
                case "B":
                    flagWhiteBishop++;
                    break;
                case "N":
                    flagWhiteKnight++;
                    break;
            }
        }
        else if(listPieces[key] == ""){
            nbPieceOut++;
        }
    }

    // king against king
    if(nbPieceOut == 30)
        return true;

    // not sufisally piece to checkmate
    if(flagBlackBishop + flagBlackKnight <= 2)
        if(flagWhiteBishop + flagWhiteKnight <= 2 && flagOponnentPiece == 0)
            return true;

    // check if the king is check, if is it's not a stalemate
    var kingPos = nameCaseToPosition(kingCase);
    var pieceCheck = pieceWhichAttackTheCase(kingPos, colorPiece);
    if (pieceCheck)
        return false;

    // if the king can move, it's not stalemate
    for (var i = -1; i <= 1; i++) {
        if (kingPos[0] + i > 0 && kingPos[0] + i < 9) {
            for (var j = -1; j <= 1; j++) {
                if (kingPos[1] + j > 0 && kingPos[1] + j < 9) {
                    newKingPos[0] = kingPos[0] + i;
                    newKingPos[1] = kingPos[1] + j;
                    if (checkDeplacement(colorPiece + "_K", kingCase, namePositionToCase(newKingPos)) != false) {
                        return false;
                    }
                }
            }
        }
    }

    // check for each case
    for (var i = 1; i<= 8; i++){
        for (var j = 1; j<=8; j++){
            // check if each piece can move
            for (var key in listPieces) {
                // if piece is the same color as the king, we check if it can move
                if (key.charAt(0) == colorPiece){
                    newPos[0] = i;
                    newPos[1] = j;
                    // if it can move it's not a stalemate
                    if (checkDeplacement(key, listPieces[key], namePositionToCase(newPos)) != false) {
                        return false;
                    }
                }
            }
        }
    }

    return true;
}