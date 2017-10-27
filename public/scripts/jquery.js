"use strict";


$(document).ready(function (e) {
    function showView(viewName) {
        $('.view').hide();
        $('#' + viewName).show();
    }

    $('[data-launch-view]').click(function (e) {
        e.preventDefault();
        var viewName = $(this).attr('data-launch-view');
        
        $('#menu_user').removeClass('active');
        $('#menu_game').removeClass('active');
        $('#menu_history').removeClass('active');
        $('#menu_about').removeClass('active');
        
        $(this).addClass('active');
        showView(viewName);
    });
});

