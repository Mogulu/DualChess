$( init );

var idGame;
var colorPlayer;

function init() {

    // Reset the game
    $('#chessboard').html( '' );

    // Create the chess board
    for ( var i=1; i<=64; i++ ) {

        var lettre = "";
        var chiffre = "";

        switch (i%8)
                {
            case 0:
                lettre = "H";
                break;
            case 1:
                lettre = "A";
                break;
            case 2:
                lettre = "B";
                break;
            case 3:
                lettre = "C";
                break;
            case 4:
                lettre = "D";
                break;
            case 5:
                lettre = "E";
                break;
            case 6:
                lettre = "F";
                break;
            case 7:
                lettre = "G";
                break;
        }

        switch (Math.floor((i-1)/8))
                {
            case 0:
                chiffre = "8";
                break;
            case 1:
                chiffre = "7";
                break;
            case 2:
                chiffre = "6";
                break;
            case 3:
                chiffre = "5";
                break;
            case 4:
                chiffre = "4";
                break;
            case 5:
                chiffre = "3";
                break;
            case 6:
                chiffre = "2";
                break;
            case 7:
                chiffre = "1";
                break;
        }

        if(Math.floor( (i-1)/8) % 2 == 0)
        {
            if(i%2 == 0)
            {
                $('<div id="'+ lettre + chiffre +'" style="font-size: 75%; color: white; background-color: black; position: absolute; height: 70%; width: 6%; margin-left:'+ (6*((i-1)%8)) +'%;margin-top:'+ (6 * Math.floor( (i-1)/8) ) +'%;">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
            }
            else
            {
                $('<div id="'+ lettre + chiffre +'" style="font-size: 75%; background-color: white; position: absolute; height: 70%; width: 6%; margin-left:'+ (6*((i-1)%8)) +'%;margin-top:'+ (6 * Math.floor( (i-1)/8) ) +'%;">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
            }
        }
        else
        {
            if(i%2 == 0)
            {
                $('<div id="'+ lettre + chiffre +'" style="font-size: 75%; background-color: white; position: absolute; height: 70%; width: 6%; margin-left:'+ (6*((i-1)%8)) +'%;margin-top:'+ (6 * Math.floor( (i-1)/8) ) +'%;">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
            }
            else
            {
                $('<div id="'+ lettre + chiffre +'" style="font-size: 75%; color: white; background-color: black; position: absolute; height: 70%; width: 6%; margin-left:'+ (6*((i-1)%8)) +'%;margin-top:'+ (6 * Math.floor( (i-1)/8) ) +'%;">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
            }
        }
    }
}
