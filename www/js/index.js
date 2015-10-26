/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    
    main_url: "https://www.monicare.com/",
    deviceId: '',
    
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
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {

        // Mock device.platform property if not available
        if (!window.device) {
            window.device = { platform: 'Browser' };
        }
        
        this.deviceId = device.platform + device.model + device.uuid;
        
        //this.handleExternalURLs();        
        
//        $('#map-canvas').gmap({ 'center': new google.maps.LatLng(41.9407, -87.7542), 'zoom':9, 'mapTypeId': google.maps.MapTypeId.ROADMAP, 'callback': function() {
//            // slepiam poto kai mapsas uzsikrauna ?
//            $('.app').hide();
//            //alert('callback');
//        }});
        
        app.loadItems();
        
        var $app = this;
                
        $('#home').click(function(){
            $('#top_navigation ul').slideDown(500);
        });
        $('body').click(function(e){
            if ($(e.target).parents('#top_navigation').size() > 0) {
                
            }else{
                $('#top_navigation ul').slideUp(500);
            }            
        });
        
        $('a.nav_link').click(function(){
            
            var pg = $(this).attr('href');
            var dir = $(this).attr('data-dir');
            
            app.loadPage(pg, dir);
            
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

        var USER_ID = localStorage.getItem('user_id');
        
        if(USER_ID){
            $('#login-btn').hide();
            app.loadUser();
            //$('#logged_user-btn span').html(localStorage.getItem('user_name'));
        }else{
            $('#logged_user-btn').hide();
        }
        
        $('#logout-btn').click(function(){
            
            app.startLoading();
            
            $.ajax({
                url: app.main_url + "app/auth/ajax_logout",
                method: 'GET',
            }).done(function() {
                        
                app.endLoading();
                        
                $('#logged_user-btn').hide();
                $('#login-btn').show();

                app.loadPage('#all', 'left');

                localStorage.clear();
                        
            }).fail(function(jqXHR, textStatus) {
                //console.log("error"); 
                alert("Request failed: " + textStatus);
                app.endLoading();
            });            

        });
        
        $("#close-dialog").click(function(){
            app.close_dialog();
        });
        
        $('#login-form').on('submit', function(){
            
            app.startLoading();
            
            $.ajax({
                url: app.main_url + "app/auth/ajax_login",
                dataType: 'json',
                method: 'POST',
                data: $('#login-form').serialize()
            }).done(function(json) {
                try{
                    if(json.ok == 1 && json.role == 5){
                        
                        app.endLoading();
                        
                        localStorage.setItem('user_id', json.user_id);
                        localStorage.setItem('user_name', json.user_name);
                        
                        localStorage.setItem('user_data', JSON.stringify(json.user_data));
                        //$('#logged_as_name').html(json.user_name);
                        
                        $('#logged_user-btn').show();
                        $('#login-btn').hide();
                        
                        app.loadUser();
                        app.loadPage('#user', 'right');
                        
                        app.show_msg('#user .login-success');
                        
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
                alert("Request failed: " + textStatus);
                app.endLoading();
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
                alert("Request failed: " + textStatus);
                app.endLoading();
            }); 
            return false;            
        });
        
        $('[data-rel=external]').click(function(){
            var link = $(this).attr('data-link');
            var ref = window.open(encodeURI(link), '_system');
            //ref.close();
        });
        
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
    },
    
    loadPage:function(pg, dir){
        $('.app').hide();
        if(pg == '#contacts'){
            app.load_contacts(); 
        }else if(pg == '#map'){
            app.load_map();
        }else if(pg == '#interested'){
            app.load_interested();
        }else{
            $(pg).show("slide", { direction: (dir ? dir : "left") }, 1000);
            $('#top_navigation ul').hide();
        }
    },
    
    load_map: function(){
        
        var window_height = $( window ).height();
        var header_height = $('#page_header').height();
        var max_map_height = window_height - header_height;
        
        $( "#map" ).css({ 'margin-top': header_height + 'px' });
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
                icon: "https://chart.googleapis.com/chart?chst=d_map_spin&chld=0.7|0|DC699A|13|b|"+m.length 
            }).click(function() {

                var pin_html = '';
                $.each( m, function(j, job_item) {
                    pin_html += '<a class="pin_more m_btn" rel="' + job_item.id + '">' + job_item.heading + ' &gt;&gt;</a>';
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
                    $(this).parents('.domestic-job-item').find('.job-content').slideToggle(500);
                });

                app.endLoading();
                $("#interested").show("slide", { direction: "left" }, 1000);
                $('#top_navigation ul').hide();
            }
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
            });
        }else{
            $("#contacts").show("slide", { direction: "left" }, 1000);
            $('#top_navigation ul').hide();
        }
    },
    
    loadUser: function(){
        user_data = JSON.parse(localStorage.getItem('user_data'));//, JSON.stringify(json));
        $('#user [data-rel=name] .v').html(user_data.first_name + " " + user_data.last_name);
        $('#user [data-rel=email] .v').html(user_data.email);
        $('#user [data-rel=phone] .v').html(user_data.phone);
        $('#user [data-rel=city] .v').html(user_data.city + " " + user_data.state);
    },
    
    openInterest: function(job_id){
        $.ajax({
            url: app.main_url + "app/job/interest_dialog/" + job_id,
            cache: false,
            beforeSend:function(){
                app.startLoading();
            },
            success: function(html){
                app.open_dialog("I'm interested in this Job", html);
                app.endLoading();
            }
        });
    },
    
    openFillOut: function(job_id){
        
    },
    
    recommend_dialog: function(job_id, anonymous){
        //app.open_dialog((anonymous==1 ? "Forward this Job" : "Recommend a Friend"), "<p style='text-align:center'>Loading...<br />Please wait...</p>");
        $.ajax({
            url: app.main_url + "app/recommend/" + (anonymous==1 ? "anonymous" : "dialog") + "/" + job_id + "/" + anonymous,
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
        $.ajax({
            url: $app.main_url + "app/job/get_json",
            dataType: 'json'
        }).done(function(json) {
            try{
                $app.renderJobs(json.all);
            }catch(err) {
                alert("Error: " + err.message);
            }
        }).fail(function() {
            alert("error");
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
            $(this).parents('.domestic-job-item').find('.job-content').slideToggle(500);
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
    
    open_dialog:function(title, content){
        
        $( "#dialogPage .ui-title" ).html(title);
        $( "#dialogPage .ui-content" ).html(content);
        
        $('.overlay').show();
        $( "#dialogPage" ).show();
        
        var dialog_height = $( "#dialogPage" ).height();
        var window_height = $( window ).height();
        var max_dialog_height = window_height - 20;
        
        if(dialog_height > max_dialog_height){
            $( "#dialogPage .ui-content" ).height(max_dialog_height - $('#dialogPage .ui-header').height());
            dialog_height = max_dialog_height;
        }
        
        var dialog_top_pos = parseInt((window_height - dialog_height) / 2);
        $( "#dialogPage" ).css({'top': dialog_top_pos + 'px'});
        
        //alert(content);
    },

    close_dialog:function(){
        
        $('.overlay').hide();
        $( "#dialogPage" ).hide();
        
    },
    
    startLoading: function(){
        $('#loading').show();
    },
    
    endLoading: function(){
        $('#loading').hide();
    },
        
};

app.initialize();

//$(document).ready(function(){
//    
//    $.ajax({
//        url: app.main_url + "app/job/get_json",
//        dataType: 'json'
//    }).done(function(json) {
//        var html = "";
//        for(var i=0; i < json.length; i++){
//            html += $("#domestic-job-tpl").render(json[i]);
//        }
//        $('#domestic-jobs-content').html(html);
//    }).fail(function() {
//        console.log("error"); 
//    });                        
//    
//    
//});