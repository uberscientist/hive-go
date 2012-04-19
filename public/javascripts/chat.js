String.prototype.parseURL = function() {
	return this.replace(/[A-Za-z]+:\/\/[A-Za-z0-9-_]+\.[A-Za-z0-9-_:%&~\?\/.=]+/g, function(url) {
		return url.link(url);
	});
};

function sanitize(text){
  var i;
  var clean_text = '';
  var escape = '<>';
  for(i = 0; i < text.length; i++){
    var c = text.charAt(i);
    if(escape.indexOf(c) == -1) clean_text += c;
    if(escape.indexOf(c) == 0) clean_text += '&lt;';
    if(escape.indexOf(c) == 1) clean_text += '&gt;';
  }
  return clean_text;
}

//function to display new messages
function display_msg(name,msg) { 
  var text = sanitize($('#text_entry').attr('value'));
  $('#chatbox').append('<b>'+name +'</b>: '+msg.parseURL()+'<br/>');
  $('#chatbox').scrollTop($('#chatbox')[0].scrollHeight);
  if(msg == text){
    //clear text, and refocus
    $('#text_entry').attr('value',''); 
    $('#text_entry').focus();
  }
}

//Socket.io event listeners
socket.on('chat_log', function(chat){
  $('#chatbox').append(chat.log);
});

socket.on('chat_message', function(data) {
  display_msg(data.name, data.text); 
});

$(document).ready(function(){ 

  $('#text_entry').focus();
  $('#name').val('anon-' + (9999 - Math.round(Math.random() * 9001)));
  chat_name = $('#name').attr('value');

  //on 'enter' do stuff
  $('#text_entry').keydown(function(event){  

    if(event.keyCode == '13'){
      var chat_name = $('#name').attr('value');
      var chat_send = $('#text_entry').attr('value');

      if(chat_send != '' && chat_send.length < 140 && chat_name.length < 14){
        socket.emit('chat_message', { 'name': chat_name,
                                      'text': chat_send });
      }
    };
  });
});
