var app = {
    
    main_url: "https://www.monicare.com/",
    deviceId: '',
    device: {},
    back_to_exit: false,
    dialog_opened: false,
    is_logged: false,
    viewPortWidth: 800,
    zoomsize: 1,
    current_date: {},
    open_pushbot_job_id: 0,
    
    positions_page_loaded: false,
    experience_page_loaded: false,
    
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
//        document.addEventListener('offline', this.onDeviceOffline, false);
//        document.addEventListener('online', this.onDeviceOnline, false);
    },
    
    onDeviceOffline: function(){
        this.appError("Connection lost.");
    },
    
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {

        //Pushbots.sharedInstance().debug(true);
        
        window.addEventListener("orientationchange", updateOrientation, true);
        
        window.addEventListener("resize", resize_event, false);

        document.addEventListener("showkeyboard", showkeyboard_event, false);
        document.addEventListener("hidekeyboard", hidekeyboard_event, false);        
        
        alert(typeof(PushbotsPlugin));
        if(typeof(PushbotsPlugin) != 'undefined'){
            if (PushbotsPlugin.isAndroid()) {
                document.body.style.zoom = 1 / this.zoomsize;
            }

            PushbotsPlugin.onNotificationClick(myMsgClickHandler);

            if(PushbotsPlugin.isAndroid()){
                PushbotsPlugin.initializeAndroid("5630fab4177959a53a8b4569", "338596121280");
                this.device = { platform: 1 };
            }        
        }


        // Mock device.platform property if not available
        if (!window.device) {
            window.device = { platform: 'Browser' };
        }
        
        app.deviceId = '' + device.platform + device.model + device.uuid;
	alert(app.deviceId);
        
	$('input,select,textarea').on('change', function(){
            $(this).removeClass('err');
            //$(this).closest('label').removeClass('err');
	});
        
        
        document.addEventListener("backbutton", function(e){
            
            if(app.dialog_opened){
                
                app.close_dialog();
                
            }else{
                
                navigator.app.backHistory();
                var curr_hash = location.hash;

                if(curr_hash == '' && !app.back_to_exit){
                    curr_hash = '#all';
                    app.back_to_exit = true;
                }

                if(curr_hash != ''){
                    app.loadPage(curr_hash, 'left'); 
                }else{
                    navigator.app.exitApp();
                }
                
            }

               
        }, false);        
        
        app.loadItems();
        
        var USER_ID = localStorage.getItem('user_id');
            
        if(USER_ID){
            if(app.loadUserById(USER_ID)){
                $('body').removeClass('not-logged');
                $('body').addClass('user-logged');
            }
            //$('#logged_user-btn span').html(localStorage.getItem('user_name'));
        }else{
            //$('#logged_user-btn').hide();
        }
        
        var $app = this;
        
        app.expandMenu();
                
        $('#home').click(function(){
            $('#top_navigation ul').slideDown(500);
        });
        $('body').click(function(e){
            if ($(e.target).parents('#top_navigation').size() > 0) {
                
            }else{
                $('#top_navigation ul').slideUp(500);
            }            
        });
        
        $('.phone').mask("(999) 999-9999");
        $('.zipcode').mask("99999");
        //$('#register .phone').val();
        
        $('a.nav_link').click(function(){
            
            var title = $(this).attr('title');
            var pg = $(this).attr('href');
            var dir = $(this).attr('data-dir');
            
            app.loadPage(pg, dir);
            
            window.history.pushState('', '', pg);
            
            return false;
        });
        
        $('#map-canvas').delegate('.pin_more', 'click', function(){
            var job_id = $(this).attr('rel');
            var job_data = app.get_job(job_id);
            var job_html = $("#domestic-map-job-tpl").render(job_data);
            //app.open_dialog(job_data.heading, job_html);
            
            $('#one_job .title').html(job_data.heading);
            $('#one_job_content').html(job_html);
            
            app.loadPage('#one_job', 'left');
        });

        $('#logout-btn').click(function(){
            
            app.startLoading();
            
            $.ajax({
                url: app.main_url + "app/auth/ajax_logout",
                method: 'GET',
            }).done(function() {
                        
                app.endLoading();
                        
                $('body').removeClass('user-logged');
                $('body').addClass('not-logged');

                app.loadPage('#all', 'left');
                
                $(".domestic-job-item").removeClass('interested-job');

                app.is_logged = false;
                app.experience_page_loaded = false;

                localStorage.clear();
                        
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            });            

        });
        
        $("#close-dialog").click(function(){
            app.close_dialog();
        });
        
        $('#register-form').on('submit', function(){
            
            if(validate_form($(this))){
                
                app.startLoading();

                $.ajax({
                    url: app.main_url + "app/jobseeker/registration_mobileapp/" + app.device.platform,
                    dataType: 'json',
                    method: 'POST',
                    data: $('#register-form').serialize() + '&device_id=' + app.deviceId,
                }).done(function(json) {
                    try{
                        if(json.ok == 1 && json.role == 5){

                            app.endLoading();
                            app.set_logged(json);
                            
                            app.loadPage('#positions', 'right');
                            
//                            app.loadPage('#user', 'right');
//                            app.show_msg('#user .login-success');

                        }else{
                            app.endLoading();
                            if(json.error){
                                $('#register-page-content .error-msg').html(json.error);
                            }
                            app.show_msg("#register-page-content .error-msg");
                        }
                    }catch(err) {
                        alert("Error: " + err.message);
                        app.endLoading();
                    }
                }).fail(function(jqXHR, textStatus) {
                    //console.log("error"); 
                    app.appError("Connection lost.");
                }).always(function(){
                    app.endLoading();
                });
                
            }
            return false;
        });
        
        $('#profile-form').on('submit', function(){
            
            if(validate_form($(this))){
                
                app.startLoading();

                $.ajax({
                    url: app.main_url + "app/jobseeker/profile_edit_mobileapp",
                    dataType: 'json',
                    method: 'POST',
                    data: $('#profile-form').serialize() + '&device_id=' + app.deviceId,
                }).done(function(json) {
                    try{
                        if(json.ok == 1 && json.role == 5){

                            app.endLoading();
                            app.set_logged(json);
                            
                            app.loadPage('#positions', 'right');
                            
//                            app.loadPage('#user', 'right');
//                            app.show_msg('#user .login-success');

                        }else{
                            app.endLoading();
                            if(json.error){
                                $('#profile-page-content .error-msg').html(json.error);
                            }
                            app.show_msg("#profile-page-content .error-msg");
                        }
                    }catch(err) {
                        alert("Error: " + err.message);
                        app.endLoading();
                    }
                }).fail(function(jqXHR, textStatus) {
                    //console.log("error"); 
                    app.appError("Connection lost.");
                }).always(function(){
                    app.endLoading();
                });
                
            }
            return false;
        });

        
        $('#login-form').on('submit', function(){
            
            app.startLoading();
            
            $.ajax({
                url: app.main_url + "app/auth/ajax_login",
                dataType: 'json',
                method: 'POST',
                data: $('#login-form').serialize() + '&device_id=' + app.deviceId,
            }).done(function(json) {
                try{
                    if(json.ok == 1 && json.role == 5){
                        
                        app.endLoading();
                        app.set_logged(json);
                        app.loadPage('#all', 'left');
                        app.expandMenu();
                        
//                        app.loadPage('#user', 'right');
//                        app.show_msg('#user .login-success');
                        
                    }else{
                        app.endLoading();
                        if(json.error){
                            $('#login .error-msg').html(json.error);
                        }
                        app.show_msg("#login .error-msg");
                    }
                }catch(err) {
                    alert("Error: " + err.message);
                    app.endLoading();
                }
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            });
            return false;
        });
        
        
        $('#forget-form').on('submit', function(){
            app.startLoading();
            $.ajax({
                url: app.main_url + "app/auth/ajax_forgot",
                dataType: 'json',
                method: 'POST',
                data: $('#forget-form').serialize()
            }).done(function(json) {
                try{
                    app.endLoading();
                    if(json.ok == 1){
                        //$('#forget .form').hide();
                        $('#forget .error-msg').hide();
                        $('.forget-success').html(json.msg);
                        app.show_msg(".forget-success");
                    }else{
                        if(json.error){
                            $('#forget .error-msg').html(json.error);
                        }
                        app.show_msg("#forget .error-msg");
                        $('.forget-success').hide();
                    }
                }catch(err) {
                    alert("Error: " + err.message);
                    app.endLoading();
                }
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            }); 
            return false;            
        });
        
        $('#position-form').on('submit', function(){
            app.startLoading();
            if($('#position-form input[name=position]').is(':checked')){
                $.ajax({
                    url: app.main_url + "app/jobseeker/position_ajax",
                    dataType: 'json',
                    method: 'POST',
                    data: $('#position-form').serialize()
                }).done(function(json) {
                    try{
                        app.endLoading();
                        if(json.ok == 1){
                            
                            $('#user .info-row[data-rel=position] .v').html(json.application.position);

                            app.loadPage('#experience', 'right');
                            
                            // uzdedam false tam kad paskui perkrautu experience puslapi nes skirtingos anketos Nanny, Baby Nurse ir kiti
                            if(json.experience_reload){
                                app.experience_page_loaded = true;
                            }
                            
                        }
                    }catch(err) {
                        alert("Error: " + err.message);
                        app.endLoading();
                    }
                }).fail(function(jqXHR, textStatus) {
                    //console.log("error"); 
                    app.appError("Connection lost.");
                }); 
            }else{
                alert('Please select position.');
            }
            return false;            
        });
        
        $("#experience-form").on('submit', function(){
            app.startLoading();
            if(validate_form($('#experience-form'))){
                $.ajax({
                    url: app.main_url + "app/jobseeker/ajax_jobs/" + localStorage.getItem('user_id') + "/1",
                    dataType: 'json',
                    method: 'POST',
                    data: $('#experience-form').serialize()
                }).done(function(json) {
                    try{
                        app.endLoading();
                        if($("#experience-form input[name=job_id]").val() == 0){
                            //app.send_interview_self_schedule();
                            $.ajax({ url: app.main_url + "app/jobseeker/send_self_schedule_invitation" });
                            app.loadPage('#self-schedule', 'right');
                        }else{
                            app.loadPage('#all', 'left');
                        }
                        $("#experience-form input[name=job_id]").val(json.mongo_id);
                    }catch(err) {
                        alert("Error: " + err.message);
                        app.endLoading();
                    }
                }).fail(function(jqXHR, textStatus) {
                    //console.log("error"); 
                    app.appError("Connection lost.");
                }); 
            }else{
                app.endLoading();
                alert('Please fill required fields.');
            }
            
            return false;
        });
        
        $('[data-rel=external]').live('click', function(){
            var link = $(this).attr('data-link');
            navigator.app.loadUrl(link, {openExternal: true});
            //var ref = window.open(encodeURI(link), '_system');
            //ref.close();
        });
        
    },
    
    expandMenu: function(){
        $('#top_navigation ul').slideDown(500);
        setTimeout(function(){ $('#top_navigation ul').slideUp(500); }, 3000);
    },
    
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
    },
    
    set_logged:function(json){
        
        if(typeof(json.user_data)=='undefined'){
            $.ajax({
                url: app.main_url + "app/auth/phonegap_auto_login",
                cache: false,
                method: "POST",
                dataType: "json",
                data: { user_id: json.user_id, device_id: app.deviceId },
                beforeSend:function(){
                },
                success: function(json){
                    app.set_logged(json);
                    return true;
                }
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            });
            
        }else{
            
            localStorage.setItem('user_id', json.user_id);
            localStorage.setItem('user_name', json.user_name);

            localStorage.setItem('user_data', JSON.stringify(json.user_data));
            //$('#logged_as_name').html(json.user_name);

            $('body').removeClass('not-logged');
            $('body').addClass('user-logged');

            app.loadUserPageContent(json.user_data);

            app.is_logged = true;
            
            for(i=0; i<json.interests.length; i++){
                $("#job_id_" + json.interests[i].job_post_id).addClass('interested-job');
            }
            
        }
        
    },
    
    loadPage:function(pg, dir){
        $('.app').hide();
        if(pg == '#contacts'){
            app.load_contacts(); 
        }else if(pg == '#map'){
            app.load_map();
        }else if(pg == '#interested'){
            app.load_interested();
        }else if(pg == '#interviews'){
            app.load_interviews();
        }else if(pg == '#positions'){
            app.load_positions();
        }else if(pg == '#experience'){
            app.load_experience();
        }else if(pg == '#self-schedule'){
            app.load_self_schedule();
        }else if(pg == '#exit'){
            navigator.app.exitApp();
        }else{
            $(pg).show("slide", { direction: (dir ? dir : "left") }, 1000);
            $('#top_navigation ul').hide();
        }
    },
    
    add_experience_job_item: function(data){
        
        job_type = data.job_type;
        
        html = $("#experience-" + job_type + "-job-item").render(data);
        $('#experience-jobs-content').html(html);
        
        var year_options = "";
        for(year = app.current_date.y; year >= 1960; year--){
            year_options += "<option value="+year+">"+year+"</option>";
        }
        $('#experience-jobs-content select[name=' + job_type + '_date_start_year]').append(year_options);
        $('#experience-jobs-content select[name=' + job_type + '_date_end_year]').append(year_options);
        
        $('#experience-jobs-content .phone').mask("(999) 999-9999");
        $('#experience-jobs-content .zipcode').mask("99999");

	$('input,select,textarea', $('#experience-jobs-content')).on('change', function(){
            $(this).removeClass('err');
	});
        
        $('#experience-jobs-content input[name=still_working]').on('change', function(){
            if($(this).attr('checked')){
                    $('#experience-jobs-content select[name=' + job_type + '_date_end_month]').val(app.currnet_date.m);
                    $('#experience-jobs-content select[name=' + job_type + '_date_end_year]').val(app.currnet_date.y);
                    $('#experience-jobs-content select[name=' + job_type + '_date_end_month]').attr('disabled', true);
                    $('#experience-jobs-content select[name=' + job_type + '_date_end_year]').attr('disabled', true);
            }else{
                    $('#experience-jobs-content select[name=' + job_type + '_date_end_month]').removeAttr('disabled');
                    $('#experience-jobs-content select[name=' + job_type + '_date_end_year]').removeAttr('disabled');
            }
            return false;
        });
        
        $('#experience-jobs-content select').each(function(){
            $name = $(this).attr('name');
            $(this).val(data[$name]);
        });
    },
    
    load_experience: function(){

//        if(!app.experience_page_loaded){
            
            //position = $("#position-form input[name=position]:checked").val();
            
            $.ajax({
                url: app.main_url + "app/jobseeker/experience_ajax",
                cache: false,
                dataType: 'json',
                beforeSend:function(){
                    $('#experience-jobs-content').html("");
                    app.startLoading();
                },
                success: function(data){

                    items = data.jobs;

                    var html = "";
                    
//                    for(var i=0; i < items.length; i++){
//                        html += $("#experience-childcare-job-item").render(items[i]);
//                    }
                    if(items[0]){
                        app.add_experience_job_item(items[0]);
                        //$('#experience-jobs-content').html($("#experience-childcare-job-item").render(items[0]));
                    }else{
                        app.add_experience_job_item({ job_id:0, job_type:data.job_type });
                    }

                    $("#experience").show("slide", { direction: "right" }, 1000);
                    $('#top_navigation ul').hide();

                    app.endLoading();
                    app.experience_page_loaded = true;

                }
            }).fail(function(jqXHR, textStatus) {
                    //console.log("error"); 
                    app.appError("Connection lost.");
            });
            
//            app.experience_page_loaded = true;
//        }else{
//            if($('#experience-jobs-content').html()==''){
//                app.add_experience_job_item({job_id:0});
//            }
//        }

        $("#add-another-childcare-experience").on('click', function(){
            //if(validate_last_form()){
                app.add_experience_job_item({job_id:0});
            //}
            return false;
        });
        
        $("#experience .remove-position-link").on('click', function(){
            $form = $(this).parents('form-section');
            $id = $form.attr('data-job_id');
            if($id != 0){
                $.ajax({
                    url: app.main_url + "app/jobseeker/ajax_remove_job",
                    cache: false,
                    method: "POST",
                    data: { job_id: $id },
                    dataType: 'json',
                    beforeSend:function(){
                        app.startLoading();
                    },
                    success: function(data){
                        $form.remove();
                    }
                }).fail(function(jqXHR, textStatus) {
                        //console.log("error"); 
                        app.appError("Connection lost.");
                });                
            }else{
                $form.remove();
            }            
            return false;
        });
        
        $("#experience").show("slide", { direction: "right" }, 1000);
        $('#top_navigation ul').hide();
        
    },
    
    load_self_schedule: function(){
        var date_eliminate = [], day_to_select = {};
        $.ajax({
            url: app.main_url + "app/jobseeker/self_schedule_mobileapp",
            cache: false,
            dataType: 'json',
            beforeSend:function(){
                app.startLoading();
            },
            success: function(json){
                
                try{

                    if(json.self_schedule_data.selected_period){
                        $("#self-schedule-form").hide();
                        $("#self-schedule-form-selected").show();

                        json.monicare_url = app.main_url;
                        html = $("#self-schedule-manage-assistant-selected").render(json);
                        $("#self-schedule-form-selected .manage-assistant").html(html);

                    }else{
                        $("#self-schedule-form").show();
                        $("#self-schedule-form-selected").hide();

                        $("#self-schedule-form input[name=user]").val(json.manage_assistant.id);
                        json.monicare_url = app.main_url;
                        html = $("#self-schedule-manage-assistant").render(json);
                        $("#self-schedule-form .manage-assistant").html(html);

                        for(var i=0; i < json.days_to_select.length; i++){
                            if(json.days_to_select[i].hours_easy.length == 0 || json.days_to_select[i].not_working_day == 1){
                                date_eliminate[date_eliminate.length] = json.days_to_select[i].date;
                            }else{
                                day_to_select[json.days_to_select[i].date] = json.days_to_select[i];
                            }
                        }

                        $("#self-schedule-calendar").datepicker("destroy");
                        $("#self-schedule-calendar").datepicker({
                            minDate: +1, 
                            maxDate: +14,
                            firstDay: 1,
                            dateFormat: "yy-mm-dd",
                            beforeShowDay: function(date){
                                var string = jQuery.datepicker.formatDate('yy-mm-dd', date);
                                return [$.inArray(string, date_eliminate) == -1];
                            },
                            onSelect: function(dateText, inst){
                                html = "";
                                var selected_date_data = day_to_select[dateText];
                                for(j = 0; j < 32; j++){
                                    $min = (j % 4) * 15;
                                    $title = 9 + parseInt(j / 4) + ":" + ($min == 0 ? "00" : $min) + (j < 12 ? "am" : "pm");
                                    $val = 9 * 60 + j * 15;
                                    $date = dateText;
                                    $disabled = true;
                                    for(z = 0; z < selected_date_data.hours_easy.length; z++){
                                        min_start = (selected_date_data.hours_easy[z].start - selected_date_data.mktime) / 60;
                                        min_end = (selected_date_data.hours_easy[z].end - selected_date_data.mktime) / 60;
                                        $val1 = ($val + 30);
                                        if($val >= min_start && $val1 <= min_end){
                                            $disabled = false;
                                            break;
                                        }
                                    }
                                    html += $("#self-schedule-time-select").render({ value:$val, title:$title, date:$date, disabled:$disabled });
                                }
                                app.open_dialog("Select interview time", "<div class='self-schedule-time-select-dialog'>" + html + "</div>");
                                $(".self-schedule-time-select-dialog .self-schedule-time-select").on('click', function(){
                                    if($(this).hasClass('disabled')){
                                        alert("This time is reserved. Select other time.");
                                    }else{
                                        $("#self-schedule-form .selected-self-schedule-time").html("Your selected Office Interview day and time:<br />" + day_to_select[$(this).attr('data-date')].title + " " + $(this).html());
                                        $("#self-schedule-form input[name=date]").val(day_to_select[$(this).attr('data-date')].mktime);
                                        $("#self-schedule-form input[name=time]").val($(this).attr('data-value'));
                                        $("#self-schedule-form .big_btn").show();
                                        app.close_dialog();
                                    }
                                    return false;
                                });
                            }
                        });
                    }

                    $("#self-schedule-form .confirm_btn").off("click");
                    $("#self-schedule-form .confirm_btn").on('click', function(){
                        app.confirm_interview_schedule();
                        return false;
                    });
                    $("#self-schedule-form-selected .cancel_btn").off("click");
                    $("#self-schedule-form-selected .cancel_btn").on('click', function(){
                        app.cancel_interview_schedule();
                        return false;
                    });

                    $("#self-schedule").show("slide", { direction: "right" }, 1000);
                    $('#top_navigation ul').hide();

                
                }catch(err) {
                    alert("Error: " + err.message);
                }                    

                app.endLoading();

            }
        }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
        });
        
    },
    
    confirm_interview_schedule: function(){
        if($("#self-schedule-form input[name=date]").val() && $("#self-schedule-form input[name=time]").val()){
            $.ajax({
                type: "POST",
                dataType: "json",
                data: { dt: $("#self-schedule-form input[name=date]").val(), tm: $("#self-schedule-form input[name=time]").val(), user:$("#self-schedule-form input[name=user]").val() },
                url: app.main_url + "app/jobseeker/confirm_interview_schedule",
                beforeSend: function(){
                    app.startLoading();
                },
                success: function(json){
                    try{
                        if(json.error != 1){
                            app.load_self_schedule();
                        }else{
                            alert(json.message);
                        }
                        app.endLoading();
                    }catch(err) {
                        alert("Error: " + err.message);
                    }                    
                }
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            });        

        }else{
            alert("Please select period.");
        }        
    },
    
    cancel_interview_schedule:function(){
        if(confirm("Do you really want to cancel office interview?")){
            
            $("#self-schedule-form .selected-self-schedule-time").html("");
            $("#self-schedule-form input[name=date]").val('');
            $("#self-schedule-form input[name=time]").val('');
            $("#self-schedule-form .big_btn").hide();
            
            $.ajax({
                type: "POST",
                data: {  },
                url: app.main_url + "app/jobseeker/cancel_interview_schedule",
                beforeSend: function(){
                },
                success: function(json){
                    try{
                        app.load_self_schedule();
                    }catch(err) {
                        alert("Error: " + err.message);
                    }                    
                }
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            });        
        }
    },
    
    load_positions: function(){
        
//        if(app.positions_page_loaded){
//            
//            $("#positions").show("slide", { direction: "left" }, 1000);
//            $('#top_navigation ul').hide();
//            
//        }else{

            $.ajax({
                url: app.main_url + "app/jobseeker/position_ajax",
                cache: false,
                dataType: 'json',
                beforeSend:function(){
                    $('#positions-content').html("");
                    app.startLoading();
                },
                success: function(data){

                    items = data.positions;

                    var html = "";
                    for(var i=0; i < items.length; i++){
                        html += $("#position-select-item").render(items[i]);
                    }
                    $('#positions-content').html(html);

                    $("#positions").show("slide", { direction: "left" }, 1000);
                    $('#top_navigation ul').hide();

                    app.endLoading();
                    app.positions_page_loaded = true;

                }
            }).fail(function(jqXHR, textStatus) {
                    //console.log("error"); 
                    app.appError("Connection lost.");
            });
            
//        }
        
    },
    
    load_map: function(){
        
        var window_height = $( window ).height() * this.zoomsize;
        var header_height = $('#page_header').height();
        var max_map_height = window_height - header_height;
        
        $( "#map" ).css({ 'padding-top': header_height + 'px', 'height': max_map_height + 'px' });
        $( "#map-canvas" ).css({'height': max_map_height + 'px'});
        
        $('#map-canvas').gmap({ 'center': new google.maps.LatLng(41.9407, -87.7542), 'zoom':10, 'mapTypeId': google.maps.MapTypeId.ROADMAP });
        
    
        app.load_map_markers();
        
        $("#map").show("slide", { direction: "left" }, 1000);
        $('#top_navigation ul').hide();
    },
    
    load_map_markers: function() {
        
        var infowindow = new google.maps.InfoWindow({maxWidth: 400, height: 400});
        
        var job_items = JSON.parse(localStorage.getItem('job_items'));
        var job_items_by_zip = new Object;
        for(var i=0; i < job_items.length; i++){
            if(typeof(job_items_by_zip[job_items[i].zipcode])=='undefined'){
                job_items_by_zip[job_items[i].zipcode] = new Array;
            }
            job_items_by_zip[job_items[i].zipcode][job_items_by_zip[job_items[i].zipcode].length] = job_items[i];
        }

        $.each( job_items_by_zip, function(i, m) {
            $('#map-canvas').gmap('addMarker', { 
                position: new google.maps.LatLng(m[0].lat, m[0].lon), 
                icon: "https://chart.googleapis.com/chart?chst=d_map_spin&chld=1|0|DC699A|16|b|"+m.length 
            }).click(function() {

                var pin_html = '';
                $.each( m, function(j, job_item) {
                    pin_html += '<a class="pin_more m_btn" rel="' + job_item.id + '" href="#one_job">' + job_item.heading + ' &gt;&gt;</a>';
                });
                var pin_content = '<div class="pin_content">' + pin_html + '</div>';

                $('#map-canvas').gmap('openInfoWindow', { 
                    content : pin_content, 
                    maxWidth: 400, 
                    height: 200
                }
                , this);
            });
        });

    },
    
    load_interested: function(){
        $.ajax({
            url: app.main_url + "app/job/load_interested/",
            cache: false,
            dataType: 'json',
            beforeSend:function(){
                app.startLoading();
            },
            success: function(items){

                var html = "";
                for(var i=0; i < items.length; i++){
                    html += $("#domestic-job-tpl").render(items[i]);
                }
                $('#interested-content').html(html);
                $('#interested-content .domestic-job-item h4').click(function(){
                    $obj = $(this).parents('.domestic-job-item');
                    if($obj.find('.job-content').is(':visible')){
                        $obj.find('.icon-chevron-up').hide();
                        $obj.find('.icon-chevron-down').show();                    
                    }else{
                        $obj.find('.icon-chevron-up').show();
                        $obj.find('.icon-chevron-down').hide();                    
                    }
                    $obj.find('.job-content').slideToggle(500);
                });

                app.endLoading();
                $("#interested").show("slide", { direction: "left" }, 1000);
                $('#top_navigation ul').hide();
            }
        }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
        });
    },
    
    load_interviews: function(){
        $.ajax({
            url: app.main_url + "app/jobseeker/interviews_mobileapp",
            cache: false,
            dataType: 'json',
            beforeSend:function(){
                app.startLoading();
            },
            success: function(json){

                var html = "";
                if(json.office_appts.length){
                    for(var i=0; i < json.office_appts.length; i++){
                        var render_data = json.office_appts[i];
                        render_data.monicare_url = app.main_url;
                        html += $("#office-appts-tpl").render(render_data);
                    }
                    html += "<div class='agency_text'>" + json.bring_agency_text + "</div>";
                    $('#interviews-content').html(html);
                }

                if(json.appointments.length){
                    for(var i=0; i < json.appointments.length; i++){
                        var render_data = json.appointments[i];
                        render_data.monicare_url = app.main_url;
                        var appt_html = $("#client-appts-tpl").render(render_data);
                        $('#interviews-content').append(appt_html);
                        $('#appt_id_' + json.appointments[i].id + ' .map').gmap({ 'center': new google.maps.LatLng(41.9407, -87.7542), 'zoom':10, 'mapTypeId': google.maps.MapTypeId.ROADMAP });
                    }
                }
                
                if(json.office_appts.length == 0 && json.appointments.length == 0){
                    $('#interviews-content').html("<p style='text-align:center'>You have no interviews</p>");
                    app.load_self_schedule();
                    return false;
                }

                app.endLoading();
                $("#interviews").show("slide", { direction: "left" }, 1000);
                $('#top_navigation ul').hide();
            }
        }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
        });
    },
    
    load_contacts: function(){
        if($("#contacts-content").html()==''){
            $.ajax({
                url: app.main_url + "app/job/load_contacts/",
                cache: false,
                beforeSend:function(){
                    app.startLoading();
                },
                success: function(html){
                    $("#contacts-content").html(html);
                    app.endLoading();
                    $("#contacts").show("slide", { direction: "left" }, 1000);
                    $('#top_navigation ul').hide();
                }
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                app.appError("Connection lost.");
            });
        }else{
            $("#contacts").show("slide", { direction: "left" }, 1000);
            $('#top_navigation ul').hide();
        }
    },
    
    loadUserById: function(user_id){
        // TODO: load user by id, patikrinti user agent visokie security ir t.t. 
        
        $.ajax({
            url: app.main_url + "app/auth/phonegap_auto_login",
            cache: false,
            method: "POST",
            dataType: "json",
            data: { user_id: user_id, device_id: app.deviceId },
            beforeSend:function(){
                app.startLoading();
            },
            success: function(json){
                app.endLoading();
                app.set_logged(json);
                return true;
            }
        }).fail(function(jqXHR, textStatus) {
            //console.log("error"); 
            app.appError("Connection lost.");
        });
            
        return false;
    },
    
    loadUserPageContent: function(data){
        if(data.application){
            $('#user .info-row[data-rel=position] .v').html(data.application.position);
            
            $("#positions-content input[value='" + data.application.position + "']").attr('checked', true);
            if(data.application.looking_for){
                for(i=0; i < data.application.looking_for.length; i++){
                    $("#looking-for-content input[value='" + data.application.looking_for[i] + "']").attr('checked', true);
                }
            }
        }
        
        $('#user .info-row[data-rel=name] .v').html(data.first_name + " " + data.last_name);
        $('#user .info-row[data-rel=email] .v').html(data.email);
        $('#user .info-row[data-rel=phone] .v').html(data.phone);
        $('#user .info-row[data-rel=city] .v').html(data.city + ", " + data.zipcode);

        $('#profile input[name=first_name]').val(data.first_name);
        $('#profile input[name=last_name]').val(data.last_name);
        $('#profile input[name=email]').val(data.email);
        $('#profile input[name=phone]').val(data.phone);
        $('#profile input[name=city]').val(data.city);
        $('#profile input[name=zipcode]').val(data.zipcode);
    },
    
    openInterest: function(job_id){
        $.ajax({
            url: app.main_url + "app/job/interest_dialog/" + job_id + "/1",
            cache: false,
            beforeSend:function(){
                app.startLoading();
            },
            success: function(html){
                app.open_dialog("I'm interested in this Job", html);
                app.endLoading();
                if(app.is_logged){
                    app.confirm_interested_job_post(job_id);
                }
            }
        });
    },
    
    confirm_interested_job_post:function(job_id){
        
        $("#job_id_" + job_id).addClass('interested-job');
        
        app.close_dialog();
        app.endLoading();        
    },
    
    openFillOut: function(job_id){
        var url = "https://www.monicare.com/app/jobseeker/qualification";
        if (device.platform.toUpperCase() === 'ANDROID') {
            navigator.app.loadUrl(url, { openExternal: true });
        }
        else if (device.platform.toUpperCase() === 'IOS') {
            window.open(url, '_system');
        }
    },
    
    recommend_dialog: function(job_id, anonymous){
        //app.open_dialog((anonymous==1 ? "Forward this Job" : "Recommend a Friend"), "<p style='text-align:center'>Loading...<br />Please wait...</p>");
        $.ajax({
            url: app.main_url + "app/recommend/" + (anonymous==1 ? "anonymous" : "dialog") + "/" + job_id + "/" + anonymous + "/1",
            beforeSend: function(){
                app.open_dialog((anonymous==1 ? "Forward this Job" : "Recommend a Friend"), "<p style='text-align:center'>Loading...<br />Please wait...</p>");
            }
        }).done(function(html) {
            //app.close_dialog();
            app.open_dialog((anonymous==1 ? "Forward this Job" : "Recommend a Friend"), html);
        }).fail(function() {
            alert("error");
        });
    },
    
    loadItems: function(){
        
        var $app = this;
	alert($app.main_url);
        $.ajax({
            url: $app.main_url + "app/job/get_json",
            dataType: 'json'
        }).done(function(json) {
            try{
		alert(json.current_date);
                $app.current_date = json.current_date;
                $app.renderJobs(json.all);
                if($app.open_pushbot_job_id){
                    $obj = $("#job_id_" + $app.open_pushbot_job_id);
                    $obj.find('.icon-chevron-up').show();
                    $obj.find('.icon-chevron-down').hide();                    
                    $obj.find('.job-content').show();
                    $(window).scrollTop(parseInt($obj.offset().top - $("#page_header").height() - 10));
                    $app.open_pushbot_job_id = 0;
                }
            }catch(err) {
                alert("Error: " + err.message);
            }
        }).fail(function(jqXHR, textStatus) {
                //console.log("error");
		alert('error: ' + textStatus); 
                app.appError("Connection lost.");
        });                        
        
    },
    
    get_job: function(job_id){
        var job_data = false;
        $.each(this.job_items, function(i, val){
            if(val.id == job_id){
                job_data = val;
            } 
        });
        return job_data;
    },
    
    renderJobs: function(items){
        $('#all').show();
        $('#loading').hide();
        var html = "";
        var arr = new Array;
        for(var i=0; i < items.length; i++){
            html += $("#domestic-job-tpl").render(items[i]);
            arr[arr.length] = items[i].id;
        }
        $('#domestic-jobs-content').html(html);
        $('.domestic-job-item h4').click(function(){
            $obj = $(this).parents('.domestic-job-item');
            if($obj.find('.job-content').is(':visible')){
                $obj.find('.icon-chevron-up').hide();
                $obj.find('.icon-chevron-down').show();                    
            }else{
                $obj.find('.icon-chevron-up').show();
                $obj.find('.icon-chevron-down').hide();                    
            }
            $obj.find('.job-content').slideToggle(500);
        });
        this.job_items = items;
        localStorage.setItem('job_items', JSON.stringify(items));
    },
    
    handleExternalURLs: function() {
        // Handle click events for all external URLs
        if (device.platform.toUpperCase() === 'ANDROID') {
            $(document).on('click', 'a[href^="http"]', function (e) {
                var url = $(this).attr('href');
                navigator.app.loadUrl(url, { openExternal: true });
                e.preventDefault();
            });
        }
        else if (device.platform.toUpperCase() === 'IOS') {
            $(document).on('click', 'a[href^="http"]', function (e) {
                var url = $(this).attr('href');
                window.open(url, '_system');
                e.preventDefault();
            });
        }
        else {
            // Leave standard behaviour
        }
    },
    
    show_msg:function(target){
        $(target).show();
        setTimeout(function() { $(target).hide('blind', {}, 1000) }, 7000);
    },
    
    calculate_dialog_position:function(){
        var dialog_height = $( "#dialogPage" ).height();
        var dialog_inner_height = $( "#dialogPage .ui-content" ).height();
        var window_height = parseInt($( window ).height()) * this.zoomsize;
        var max_dialog_height = window_height - 20;
        
        if(dialog_inner_height > dialog_height){
            
        }
        
        if(dialog_height > max_dialog_height){
            $("#dialogPage").height(max_dialog_height);
            dialog_height = max_dialog_height;
        }
        
        var dialog_top_pos = parseInt((window_height - dialog_height) / 2);
        
        $( "#dialogPage" ).css({'top': dialog_top_pos + 'px'});
    },
    
    open_dialog:function(title, content){
        
        $( "#dialogPage .ui-title" ).html(title);
        $( "#dialogPage .ui-content" ).html(content);
        
        $('.overlay').show();
        $( "#dialogPage" ).show();
        
        this.dialog_opened = true;
        
        //window.history.pushState('', '', '#dialog');
        
        this.calculate_dialog_position();
        //alert(content);
    },

    close_dialog:function(){
        
        $('.overlay').hide();
        $( "#dialogPage" ).hide();
        
        this.dialog_opened = false;
        
    },
    
    startLoading: function(){
        $('#loading').show();
    },
    
    endLoading: function(){
        $('#loading').hide();
    },
        
    appError:function(message){
        $('#empty_page [data-role=content]').html("<p class='error-msg'>" + message + "</p>")
        this.endLoading();
    },
    
};

app.initialize();
