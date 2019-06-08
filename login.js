/**
 * Created by rui on 08/10/15.
 */
;(function() {
    'use strict';

    var lastCardSwipe = null;
    var serverUri = 'https://cordeirovending.luope.com/api/';
    var serverApi = {
        auth: 'kiosk/auth',
        authCard: 'kiosk/authByCard'
    };

    var hasCardReader = false;

    if (hasCardReader == true) {
        $('#card-intro').show();
        $('#login-form').hide();
    }

    /*$("#pin-input").keyboard({
        display: {
            'bksp'   :  "\u2190",
            'accept' : 'return'
        },
        layout : 'custom',
        customLayout: {
            default: [
                '1 2 3 {a}',
                '4 5 6 {bksp}',
                '7 8 9 0'
            ]
        },
        //restrictInput : true, // Prevent keys not in the displayed keyboard from being typed in
        preventPaste : true,  // prevent ctrl-v and right click
        //autoAccept : true,
        accepted: function () { submitPinRequest(); },
        stayOpen: true,
        usePreview: false
    });*/

    if (hasCardReader) {
        var socket = io.connect('http://localhost:3000/');
        socket.on('connect', function() {
            console.log("Connected to socket.");

            socket.on('serial', function(serialNr) {
                console.log("Serial: " + serialNr);
                $.post(serverUri + serverApi.authCard, {card_id: serialNr}, function(data) {
                    if (!data.hasOwnProperty('error')) {
                        nextView(data);
                    } else {
                        if (data.pin_request) {
                            lastCardSwipe = serialNr;
                            showPinRequest();
                        } else {
                            swal("Erro!", "Cartão não reconhecido", "error");
                        }
                    }

                }).fail(function(errData) {
                    console.log(errData);
                    swal("Erro!", "Erro de conexão", "error");
                });
            });
        });
    }

    function nextView(data) {
        userVis.$data = data;
        localStorage.setItem('app-token', data.token);
        $('#login-form').hide();
        $("#pin-request").hide();
        $("#card-intro").hide();
        $('#user-info').show();

        setTimeout(function() {
            window.location.replace('dashv1.html'); //replace dashboard with dashv1
        }, 1500);
    }


    function whatisthere(data){

        console.log("ola"+JSON.stringify(data));

    }

    function showPinRequest() {
        $("#pin-request").show();
        $("#login-form").hide();
        $("#pin-input").focus();
    }

    function submitPinRequest() {
        $.post(serverUri + serverApi.authCard, {card_id: lastCardSwipe, pin: $("#pin-input").val()}, function(data) {
            if (data.hasOwnProperty('error')) {
                swal("Erro!", "Pin incorreto", "error");
            } else {
                nextView(data);
            }
        }).fail(function(errData) {
            console.log(errData);
            swal("Erro!", "Erro de conexão", "error");
        });
    }

   //$("#try-pin").on('click', submitPinRequest);

    var userVis = new Vue({
        el: '#user-info',
        data: {
            name: 'Rolando Rocha',
        }
    });




    var userLogin =  new Vue({
        el: '#login-form',
        data: {
            username: '',
            password: ''
        },
        methods: {
            submitAuth: function(username, password) {
                return $.post(
                    serverUri + serverApi.auth,
                   {email: username, password: password},                   
                    function(data) {
                        console.log("ola do login"+serverUri + serverApi.auth );
                        localStorage.setItem('app-token', data.token);
                        nextView(data);
                        //whatisthere(data);
                    });
            }
        }
    });
})();