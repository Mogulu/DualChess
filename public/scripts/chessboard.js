$( init );

var idGame;
var colorPlayer;

function init() {

    // Reset the game
    $('#chessboard').html( '' );

    var widthWindow = $(window).width();
    var widthChessboard;
    if ($('#chessboard').width() != 50)
        widthChessboard= $('#chessboard').width() * 0.66;
    else
        widthChessboard= ($('#chessboard').width() * 0.66 / 100) * widthWindow;

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
                $('<div id="'+ lettre + chiffre +'" class=\'blackCase\' ">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
                var height = widthChessboard / 8;
                var marginleft = height * ((i-1)%8);
                var margintop = height * Math.floor((i-1)/8);
                $("#" + lettre + chiffre).css("height", height+"px");
                $("#" + lettre + chiffre).css("width", height+"px");
                $("#" + lettre + chiffre).css("margin-left", marginleft+"px");
                $("#" + lettre + chiffre).css("margin-top", margintop+"px");
            }
            else
            {
                $('<div id="'+ lettre + chiffre +'" class=\'whiteCase\' ">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
                var height = widthChessboard / 8;
                var marginleft = height * ((i-1)%8);
                var margintop = height * Math.floor( (i-1)/8);
                $("#" + lettre + chiffre).css("height", height+"px");
                $("#" + lettre + chiffre).css("width", height+"px");
                $("#" + lettre + chiffre).css("margin-left", marginleft+"px");
                $("#" + lettre + chiffre).css("margin-top", margintop+"px");
            }
        }
        else
        {
            if(i%2 == 0)
            {
                $('<div id="'+ lettre + chiffre +'" class=\'whiteCase\' ">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
                var height = widthChessboard / 8;
                var marginleft = height * ((i-1)%8);
                var margintop = height * Math.floor( (i-1)/8);
                $("#" + lettre + chiffre).css("height", height+"px");
                $("#" + lettre + chiffre).css("width", height+"px");
                $("#" + lettre + chiffre).css("margin-left", marginleft+"px");
                $("#" + lettre + chiffre).css("margin-top", margintop+"px");
            }
            else
            {
                $('<div id="'+ lettre + chiffre +'" class=\'blackCase\' ">' + lettre + chiffre + '</div>').appendTo( '#chessboard' ).droppable( {
                    hoverClass: 'hovered',
                    drop: pieceDrop
                } );
                var height = widthChessboard / 8;
                var marginleft = height * ((i-1)%8);
                var margintop = height * Math.floor( (i-1)/8);
                $("#" + lettre + chiffre).css("height", height+"px");
                $("#" + lettre + chiffre).css("width", height+"px");
                $("#" + lettre + chiffre).css("margin-left", marginleft+"px");
                $("#" + lettre + chiffre).css("margin-top", margintop+"px");
            }
        }
    }
}
