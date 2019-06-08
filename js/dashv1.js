/**
 * Created by rui on 08/10/15.
 */
//(function() {
    Vue.config.debug = true;
    var hasCardReader = false;
    var appToken = localStorage.getItem('app-token');
    var serverUri = 'https://cordeirovending.luope.com/api/';
    /**
     * stateless API. uses token
     * token is added in the next routine.
     */
    var serverApi = {
        info: 'kiosk/user/getInfo',
        logout: 'kiosk/user/logout' ,
        canteens: 'kiosk/canteen/getAll',
        ement: 'kiosk/ement/getByCanteen',
        allOperations: 'kiosk/movement/getAll',
        reserve: 'kiosk/ement/reserve',
        unreserve: 'kiosk/ement/unreserve',
        reservedMeals: 'kiosk/ement/reserved',
        setMail: 'kiosk/user/updateEmail',
        updateInfo: 'kiosk/user/updateInfo'
    };
    for (var prop in serverApi) {
        if (serverApi.hasOwnProperty(prop)) {
            serverApi[prop] = serverApi[prop] + '/' + appToken;
        }
    }



  
    if (appToken === undefined) {
        console.log('app token is undefined.. redirecting to login');
        goToLogin();
    } else {
        console.log('app-token from localStorage: ' + appToken);
    }

    moment.locale('pt');

    function goToLogin() {
        document.location.replace('contactoInterface.html');
    }

    var accountView = new Vue({
        el: "#account-settings",
        data: {
            name: "",
            email: "",
            phone: "",
            zip_code: "",
            city: "",
            vat: null,
            pin: "",
            password: ""
        },
        methods: {

            sendUpdate: function() {
                postData = JSON.parse(JSON.stringify(this.$data));

                delete postData.cards;
                delete postData.id;

                if ($.trim($("#pin-user").val()) == "") {
                    console.log('no pin change. do not send this prop');
                    delete postData.pin;
                } else {
                    postData.pin = $.trim($("#pin-user").val());
                }
                if ($.trim($("#pw-user").val()) == "") {
                    console.log('no password change. do not send this prop');
                    delete postData.password;
                } else {
                    postData.password = $.trim($("#pw-user").val());
                }

                console.log(postData);

                $.post(serverUri + serverApi.updateInfo, postData, function(data) {
                    console.log(data);
                    swal("Informação submetida", "A sua informação foi atualizada!", "success");
                }, "json");
            },

            changeData: function(newData) {
                this.$data = newData;
                this.$data.pin = "";
                this.$data.password = "";
                console.log('changing data');
            }
        }
    });

    var userData = new Vue({
            el:'#user-data',
            data: {
                name: 'nome de utilizador'
            },
            methods: {
                pullData: function() {
                    $.post(serverUri + serverApi.info, function(data) {
                        userData.$data = data;
                        accountView.changeData(data)
                        // clone object here
                    }, "json");
                },
                logout: function() {
                    $.post(serverUri + serverApi.logout, function(response) {
                        if (response.logout == true) { goToLogin(); }
                    }).fail(function() {
                        goToLogin();
                    });
                }
            }
        });

    var canteenList = new Vue({
        el: '#canteen-list',
        data: {
            title: 'canteens',
            canteens: []
        },
        methods: {
            pullData: function() {
                var self = this;
                $.post(serverUri + serverApi.canteens, function(data) {
                    //console.log("O QUE É ISTO ?:"+JSON.stringify(data));
                    $(data).each(function(i,o) {
                        o.selected = false;
                    });
                    self.$data.canteens = data;

                   // console.log("wHATa"+JSON.stringify(data));
/////////////////////////////////////////////AQUI È SELECIONADO POR DEFAULT  A CANTINA 0 = CANTINA1 ; 1 = CANTINA 2; 2 = CANTINA ESTH
                    self.select(data[0]);
                });
            },
            select: function(item) {
                
                
                var self = this;
                $.each(self.$data.canteens, function(i, o) {
                    o.selected = false;
                });
                item.selected = true;
                $('#selected-canteen').html(item.description);

               //AQUI POSTA AS REFEICOES PARA COMER item.candeen_id é o id da cantina na base de dados //////////////////////////
                $.post(serverUri + serverApi.ement, {canteen_id: item.canteen_id}, function(data) {
                    //console.log("E O QUE È AQUILO"+JSON.parse(JSON.stringify(data)));

                   // console.log("E O QUE È AQUILO"+JSON.stringify(data));
                    
                   //console.log("cantina"+item.canteen_id);
                    var by_date = {};

                    $(data).each(function(i,o) {
                        o.canteen = item.description;
                        
                        
                        o.moment_date = moment(o.date).format('dddd LL');
                        if (!by_date.hasOwnProperty(o.date)) {
                            by_date[o.date] = { list: [], moment_date: o.moment_date};
                            by_date[o.date].list = [];
                        } 

                        by_date[o.date].list.push(o);
                        //NO FIM DA ITERAÇAO MOSTRA AS REFEICOES // POR ISTO È QUE ESTA MERDA ESTÀ TODA MAL FEITA
                        //console.log("cantina"+JSON.stringify(by_date));
                    });
                    //clear & set list
                    ementList.$data.dates = [];
                    //DEFACTO ATUAL LISTA DE REFEICOES /////////////////////////////////////////////////

                    ///ESTA ITERACAO CORRESPONDE AOS DIAS PORTANTO É UMA LISTA DENTRO DE OUTRA LISTA
                    for (var k in by_date) {

                        

                        ementList.$data.dates.push(by_date[k]);    
                    }


                    //console.log("OLHÒ MANE"+JSON.stringify(ementList.$data.dates));
                    ementList.$data.ements = data;
                }).fail(function() {
                    goToLogin();
                });
            }
        }
    });

    function myFunction(bydia) {
        var table = document.getElementById("myTable");
        var row = table.insertRow(0);
        var cell1 = row.insertCell(0);
       // var cell2 = row.insertCell(1);
        cell1.innerHTML = JSON.stringify(bydia);
      }


    var operationsList = new Vue({
        el: '#operations-list',
        data: {
            title: 'operations',
            operations: [
                {
                    description: 'Sem dados a mostrar',
                    mov_value: '',
                    mov_date: ''
                }
            ]
        },
        methods: {
            pullData: function() {
                var self = this;
                $.post(serverUri + serverApi.allOperations, function(data) {
                    $(data).each(function(i,o) {
                        o.negative_operation = (parseFloat(o.mov_value) < 0);
                    });
                    self.$data.operations = data;
                });
            }
        },
        computed : {
            opStyle: function(op) {
                return op.negative_operation ? 'background-color: #E8E8E8;' : '';
            }
        }
    });
/////// MARCAR A REFEICAO////////////////////
    function reserveMeal(ement) {
        $.post(serverUri + serverApi.reserve, {ement_id: ement.ement_id}, function(data) {
            //console.log(data);
            userData.$data.balance = parseFloat(userData.$data.balance) - parseFloat(ement.price);
            userData.$data.balance = parseFloat(userData.$data.balance).toFixed(2);
            swal("Confirmado", "Refeição marcada!", "success");
            ement.reserved = true;
            reservationsList.pullData();
            operationsList.pullData();
        }).fail(function(xhr, textStatus) {
            // probably not logged in
            swal('Erro', 'Não foi possível marcar a sua refeição. Reposta: ' + xhr.responseJSON.error, 'error');
            //goToLogin();
        });
    }


    //////////////////    EMENTA     ////////////////////
    var ementList = new Vue({
        el: '#meals',
        data: {
            title: 'ements',
            ements: [],
            dates: []
        },
        methods: {
            reserve: function (ement) {
                console.log('reserving ement: ' + JSON.stringify(ement)); 
                    swal({
                        title: "Tem a certeza?",
                        text: "Pretende marcar a refeição " + ement.description + " em " + ement.moment_date + "?",
                        type: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#DD6B55",
                        closeOnConfirm: false,
                        closeOnCancel: true
                    }, function(){
                        reserveMeal(ement);
                    });
            }
        }
    });



//////////////////// REFEICOES RESERVADAS ///////////////////////
    var reservationsList = new Vue({
        el: '#reservations-list',
        data: {
            tite: 'reservations',
            reservations: []
        },
        methods: {
            pullData: function() {
                var self = this;
                $.post(serverUri + serverApi.reservedMeals, function(data) {
                    $(data).each(function(i,o) {
                        o.moment_date = moment(o.ement_date).format('ll');
                        o.moment_reservation_date = moment(o.reservation_date).format('lll');
                    });
                    self.$data.reservations = data;
                });
            },
            unreserve: function (reservation) {
                console.log(reservation);
                swal({
                    title: 'Tem a certeza?',
                    text: "Pretende anular a reserva para a refeição " + reservation.ement_description + " em " + reservation.moment_date + "? \n Tem um custo de € " + reservation.cancellation_tax  + ".",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DD6B55",
                    closeOnConfirm: false,
                    closeOnCancel: true
                }, function () {
                    $.post(serverUri + serverApi.unreserve, {reservation_id: reservation.reservation_id}, function(data) {
                        userData.$data.balance = parseFloat(userData.$data.balance) - parseFloat(reservation.cancellation_tax + reservation.penalization_tax);
                        userData.$data.balance = parseFloat(userData.$data.balance).toFixed(2);
                        reservation.reserved = false;
                        swal("Confirmado", "Reserva anulada!", "success");
                        operationsList.pullData();
                        reservation.cancelled = true;

                        // change in ementList
                        $(ementList.$data.ements).each(function(i,o)  {
                            if (o.ement_id == reservation.ement_id) {
                                o.reserved = false;
                            }
                        });
                        userData.pullData();
                    }).fail(function() {
                        swal("Erro!", "Não foi possível anular a sua reserva.", 'error');
                    });
                });
            }
        }
    });

    $.post(serverUri + serverApi.info, function(data) {
        console.log(data);
        userData.$data = data;
        accountView.changeData(data);
        if (data.email == '' || data.email == null || data.email == undefined) {
            console.log('prompting for email...');
            swal({
                title: "Atenção!",
                text: "Por favor indique o seu e-mail para posteriormente aceder ao sistema.",
                type: "input",
                showCancelButton: true,
                closeOnConfirm: false,
                animation: "slide-from-top",
                inputPlaceholder: "Endereço de e-mail"
                },
                function(inputValue){
                    if (inputValue === false) return false;
                    var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
                    if (re.test(inputValue) == false) {
                        swal.showInputError("Escolha um endereço de e-mail válido");
                        return false;
                    }
                    $.post(serverUri + serverApi.setMail, {email: inputValue}, function(data) {
                        //console.log(data);
                        swal.close();
                        swal("Ok!", "Associamos o email: " + inputValue, " à sua conta");
                        reservationsList.pullData();
                        accountView.$data.email = inputValue;
                        return true;
                    }).fail(function() {
                        swal.close();
                        swal('Erro!', 'Não foi possível associar o seu e-mail', 'error');
                        return false;
                    });
                    return true;
                });
        }
        canteenList.pullData();
        reservationsList.pullData();
        operationsList.pullData();
    }).fail(function() {
        goToLogin();
    });

    var inactivityTime = function () {
        var t;
        window.onload = resetTimer;
        document.onmousemove = resetTimer;
        document.onkeypress = resetTimer;
        document.addEventListener("touchstart", resetTimer, false);
        document.addEventListener("touchend", resetTimer, false);

        function resetTimer(e) {
            clearTimeout(t);
            //t = setTimeout(goToLogin, 40 * 1000);
            // 1000 ms = 1 sec
        }
    };

    inactivityTime();

//}) ();
