'use strict';

// Initializes ChessGame.
function ChessGame() {
    
    //shortcut
    this.chessboard = document.getElementById('chessboard');

    this.loadChessboard();
}



// Load the chessboard initial
ChessGame.prototype.loadChessboard = function() {

    // database connexion
    var ref = firebase.database().ref('/games');
    
    // get datas back
    ref.on("value", function(snapshot) {
        idGame = Object.keys(snapshot.val())[0];
        colorPlayer = snapshot.val()[idGame]['colorPlayer'];

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
                $('<img src="../img/pieces/'+piece+'.png" id="'+ piece +'" style="z-index: 1; margin-top:-29%; height: 100%; width: 100%; ">').appendTo('#'+listPieces[piece]).draggable( {
                    containment: '#content',
                    revert: true
                } );

                if(userId == snapshot.val()[idGame]['id_black'])
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
                else if(userId == snapshot.val()[idGame]['id_white'])
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
        if(flagMoveOK == "promot")
        {
            data[pieceId.charAt(0)+"_Q1"] = newCase;
            data[pieceId] = "";
        }
        else
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

    if(pieceId.charAt(2) != "K")
    {
        if(pieceWhichAttackTheCase( nameCaseToPosition(listPieces[pieceId.charAt(0)+"_K"]), pieceId.charAt(0), pieceId, newCase) == true)
        {
            return false;
        }
    }
    else
    {
        if(pieceWhichAttackTheCase( newPos, pieceId.charAt(0), pieceId, newCase) == true)
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
            else if(Math.abs(x) == 2 && Math.abs(y) == 0)
            {
                var data = {};
                
                if(pieceId.charAt(0) == "B" && lastCase == "E8" && listPieces["B_R1"] == "H8")
                {
                    if(pieceWhichAttackTheCase( nameCaseToPosition("F8"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("G8"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("E8"), pieceId.charAt(0), pieceId, newCase) == true)
                        return false;
                    else
                        data["B_R1"] = "F8";
                }
                else if (pieceId.charAt(0) == "B" && lastCase == "E8" && listPieces["B_R2"] == "A8")
                {
                    if(pieceWhichAttackTheCase( nameCaseToPosition("D8"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("C8"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("E8"), pieceId.charAt(0), pieceId, newCase) == true)
                        return false;
                    else
                        data["B_R2"] = "D8";
                }
                else if (pieceId.charAt(0) == "W" && lastCase == "E1" && listPieces["W_R2"] == "H1")
                {
                    if(pieceWhichAttackTheCase( nameCaseToPosition("E1"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("F1"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("G1"), pieceId.charAt(0), pieceId, newCase) == true)
                        return false;
                    else
                        data["W_R2"] = "F1";
                }
                else if (pieceId.charAt(0) == "W" && lastCase == "E1" && listPieces["W_R1"] == "A1")
                {
                    if(pieceWhichAttackTheCase( nameCaseToPosition("E1"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("D1"), pieceId.charAt(0), pieceId, newCase) == true ||
                       pieceWhichAttackTheCase( nameCaseToPosition("C1"), pieceId.charAt(0), pieceId, newCase) == true)
                        return false;
                    else
                        data["W_R1"] = "D1";
                }
                else
                    return false;
                
                // update database
                firebase.database().ref('/games/'+idGame+'/pieces').update(data);
                
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
                    
                    if(newPos[1] == 1)
                        return "promot";
                    
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
                            if(newPos[1] == 1)
                                return "promot";
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
                    
                    if(newPos[1] == 8)
                        return "promot";
                    
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
                            if(newPos[1] == 8)
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

function nameCaseToPosition(nameCase)
{
    var pos = {};
    pos [0] = nameCase.charCodeAt(0) - 64;
    pos [1] = nameCase.charCodeAt(1) - 48;

    return pos;
}

function pieceWhichAttackTheCase(casePos, colorPiece, newPiece="", newPos="")
{
    var listPieces = findPieces();
    if(newPiece != "")
    {
        listPieces[newPiece] = newPos;
    }

    var flagEchecs = 1;

    for (var key1 in listPieces) 
    {
        if(newPos == listPieces[key1] && newPiece!=key1)
        {
            listPieces[key1] = "";
        }
        
        switch(key1.charAt(2))
        {
            case "R":
                flagEchecs = 1;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);

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
                        var posPieceBetween = nameCaseToPosition(listPieces[key2]);
                        // if a piece is between lastPos and listPieces
                        if(((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) || 
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) || 
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) || 
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0])) 
                                    && ((Math.abs(posPieceBetween[0] - posPieceEchecs[0]) == Math.abs(posPieceBetween[1] - posPieceEchecs[1])) 
                                    && (Math.abs(posPieceBetween[0] - casePos[0]) == Math.abs(posPieceBetween[1] - casePos[1])))
                            )
                        {
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
            case "K":
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);
            
                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);
    
                if( Math.abs(x) <= 1 && Math.abs(y) <= 1 && colorPiece != key1.charAt(0))
                {
                    console.log("ECHECS");
                    return true;
                }
                break;
            case "Q":
                flagEchecs = 1;
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);
                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);

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
                            flagEchecs = 0;
                        }
                    }

                    if(flagEchecs == 1)
                    {
                        console.log("ECHECS");
                        return true;
                    }
                }
                else if( Math.abs(x) == Math.abs(y) && colorPiece != key1.charAt(0))
                {
                    // check if a piece is between lastPos and listPieces
                    for (var key2 in listPieces) 
                    {
                        var posPieceBetween = nameCaseToPosition(listPieces[key2])
                        // if a piece is between lastPos and listPieces
                        if(((posPieceBetween[1] < posPieceEchecs[1] && posPieceBetween[1] > casePos[1]) || 
                            (posPieceBetween[1] > posPieceEchecs[1] && posPieceBetween[1] < casePos[1]) || 
                            (posPieceBetween[0] < posPieceEchecs[0] && posPieceBetween[0] > casePos[0]) || 
                            (posPieceBetween[0] > posPieceEchecs[0] && posPieceBetween[0] < casePos[0])) 
                                        && ((Math.abs(posPieceBetween[0] - posPieceEchecs[0]) == Math.abs(posPieceBetween[1] - posPieceEchecs[1])) 
                                        && (Math.abs(posPieceBetween[0] - casePos[0]) == Math.abs(posPieceBetween[1] - casePos[1])))
                            )
                        {
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
            case "P":
                var posPieceEchecs = nameCaseToPosition(listPieces[key1]);
            
                var x = (casePos[0] - posPieceEchecs[0]);
                var y = (casePos[1] - posPieceEchecs[1]);
                if(colorPiece != key1.charAt(0) && (x==1 || x==-1) && y==1)
                {
                    console.log("ECHECS");
                    return true;
                }
                break;
        }
    }
    return false;
}