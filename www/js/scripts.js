
function onGetPictureSuccess(mediaFiles) {
    app.mediaFile = mediaFiles[0];
    if((app.mediaFile.size / (1024 * 1024)) < 100){
        initVideoPlayer(app.mediaFile.fullPath);
        app.uploadFile();
        //$('#upload-interview-video').removeClass('hide');
    }else{
        alert("Video file is too large.");
    }
}

function initVideoPlayer(videofile){
    var video = document.getElementById('user-interview-video');
    var source = document.createElement('source');
    source.setAttribute('src', videofile);
    //video.empty();
    video.appendChild(source);
    video.load();     
}

function onGetPictureFail(message) {
    alert('Failed because: ' + message);
}

function open_external_url(url){
    if(confirm("This action will open full version of MoniCare application in a browser. Do you want to leave the Jobs App now?"))
        navigator.app.loadUrl(url, { openExternal: true });
}

function showDialog(title, html){
    if(title == '') title = "&nbsp;";
    app.open_dialog(title, html);
}
function closeDialog(){
    app.close_dialog();
}
function ajax_post_form(a_url, a_obj, form){
    $.ajax({
        type: "POST",
        async: true,
        url: a_url,
        cache: false,
        data: $(document.forms[form]).serialize(),
        beforeSend: function(){
            $(a_obj).html("<p align='center'><img src='img/loading.gif' alt='' style='vertical-align:middle' /><br />Please wait...</p>");
        },
        success: function(html){
            $(a_obj).html(html);
        },
    });
}
function recommend_dialog(job_id, anonymous){
    app.recommend_dialog(job_id, anonymous);
}

function myMsgClickHandler(pusbot_data){
    if(pusbot_data.job_id){
        app.open_pushbot_job_id = pusbot_data.job_id;
    }
}

function updateOrientation(){
    app.calculate_dialog_position();
}
function resize_event(){
    app.calculate_dialog_position();
}
function showkeyboard_event(){
    app.calculate_dialog_position();
}
function hidekeyboard_event(){
    app.calculate_dialog_position();
}


function valid_field(field){
    return (field.val() ? true : false);
}
function valid_email(field){
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var attr = field.attr("data-valid-repeat");
    if(typeof attr !== 'undefined' && attr !== false){
        return (field.val() == $('#'+attr).val() && re.test(field.val()) ? true : false);
    }
    return (re.test(field.val()) ? true : false);
}
function valid_number(field){
    var re = /^-{0,1}\d*\.{0,1}\d+$/;
    return (re.test(field.val()) ? true : false);
}
function valid_url(field){
    var re = /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(\:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i;
    return (re.test(field.val()) ? true : false);
}
function valid_tel(field){
    var re = /^\+?([0-9\s-\(\)]){5,}$/;
    return (re.test(field.val()) ? true : false);
}
function valid_password(field){
    var re = /^\w+$/;
    var attr = field.attr("data-valid-repeat");
    if(typeof attr !== 'undefined' && attr !== false){
        return (field.val() == $('#'+attr).val() && re.test(field.val()) && field.val().length > 4 ? true : false);
    }
    return (re.test(field.val()) && field.val().length > 4 ? true : false);
}
function valid_checkbox(field){
    if(field.is(':checked')){
        return true;
    }else{
        return false;
    }
}
function valid_radio(field){
    var name = field.attr('name');
    var ret = false;
    $('input[name=' + name + ']').each(function(){
        if($(this).is(':checked')){
            ret = true;
        }        
    });
    return ret;
}
function validate_form(form){
    var valid = true;

    $(':input[required]:visible', form).each(function(){
        fn = valid_field;
        if($(this).attr('type')=='email') fn = valid_email;
        if($(this).attr('type')=='tel') fn = valid_tel;
        if($(this).attr('type')=='number') fn = valid_number;
        if($(this).attr('type')=='password') fn = valid_password;
        if($(this).attr('type')=='checkbox') fn = valid_checkbox;
        if($(this).attr('type')=='radio') fn = valid_radio;
        if(!fn($(this))){
            $(this).addClass('err');
            //$(this).closest('label').addClass('err');
            valid = false;
        }
    });

    return valid;
}
