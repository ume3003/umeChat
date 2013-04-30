$(function(){
	var socket = io.connect()
	/*	new val */
		,i
		,tabIndex = 0
		,$tabItem = {}
		,$tabBase = {}
		,$listItem = {}
		,$header
	/*	old val */	
		,members = {}
		,currentRoomId = 0
		,rooms = []
		,friends = []
		,currentMode = 0
		,roomListCtrl = $('#roomlist')
		,friendCtrl = $('#friendlist')
		,chatBase = $('#chatBasement')
		,createFriendList = function(num,id,name,flag){
			var $friendDiv = friendCtrl.append('<div/>').find(':last');
			$friendDiv.attr('id','friend' + num);
			$friendDiv.addClass('list');
			$friendDiv.css('top',num * 20 + 'px');
			$friendDiv.text(flag.charAt(0)+ '-' + name.substring(0,16));
			$friendDiv.click(function(){
				console.log('click on ' ,id, ' ' , flag);
			});
			friends[id] = {no:num,name:name,$friend:$friendDiv,flag:flag};

		}
		,createRoom = function(num){
			var	$chatDiv = chatBase.append('<div/>').find(':last');
			$chatDiv.attr('id','chat' + num);
			$chatDiv.addClass('chat');
			$chatDiv.text(num);
			$chatDiv.hide();
			return $chatDiv;
		}
		,changeRoom = function($chat,$room,num){
			if(roomListCtrl.current !== undefined){
				roomListCtrl.current.hide();
			}
			$chat.show();
			$room.css('font-weight','normal');
			roomListCtrl.current = $chat;
			currentRoomId = num;
		}
		,createRoomList = function(num,id,name,show){
			var	$chatDiv = createRoom(num),
				$roomDiv = roomListCtrl.append('<div/>').find(':last');
			$roomDiv.attr('id','room' + num);
			$roomDiv.addClass('list');
			$roomDiv.css('top',num * 20 + 'px');
			$roomDiv.text(name);
			(function(arg,$chat){
				$roomDiv.click(function(){
					changeRoom($chat,$roomDiv,arg);
				});
			})(id,$chatDiv);

			if(show){
				changeRoom($chatDiv,$roomDiv,id);
			}
			rooms[id] = {no:num,name:name,$chat:$chatDiv,$room:$roomDiv};
		}
		,makeBoard = function(){
			var str = "",
				m;
			for(var i in members){
				m = members[i].displayName;
				str += m + " ";
			}
			$('#memberBoard').text(str);
		};

	socket.on('msg_push',function(msg){
		var chat;
		console.log(msg);
		if(msg && msg.roomId && msg.msg && msg.msg.length > 0){
			chat = rooms[msg.roomId];
			if(chat){
				chat.$chat.prepend('<div say=' + msg.uID + '>' + msg.uID + ':' + msg.msg + '</div>');
				if(currentRoomId !== msg.roomId){
					chat.$room.css('font-weight','bold');
				}
			}
		}

	});

	socket.on('friendInvited',function(msg){
		if(msg.idx >=0){
			createFriendList(msg.idx,msg.id,msg.email,msg.stat);
		}
		console.log(msg);
	});
	socket.on('roomCreated',function(msg){
		console.log('roomCreated',msg);
		if(msg && msg.create){
			createRoomList(msg.joinCount -1,msg.roomId,msg.roomName,true);
		}
	});
	socket.on('roomList',function(msg){
		var i;
		if(msg && msg.rooms && msg.rooms.length > 0){
			for(i = 0;i < msg.rooms.length;i++){
				createRoomList(i,msg.rooms[i].id,msg.rooms[i].name,i === (msg.rooms.length -1));
			}
		}
	});
	socket.on('friendList',function(msg){
		var i;
		if(msg && msg.friends && msg.friends.length > 0){
			for( i= 0;i < msg.friends.length;i++){
				createFriendList(i,msg.friends[i].id,msg.friends[i].email,msg.friends[i].stat);
			}
		}
	});
	socket.on('logout',function(userID){
		delete members[userID];
		makeBoard();
	});
	socket.on('disconnect',function(msg){
		console.log('disconnect');		// サーバからきれたらトップへリロード
		window.location.reload();
	});

	socket.on('msg_updateDB',function(msg){
		console.log(msg);
	});
	socket.on('join',function(user){
		members[user.displayName] = user;
		console.log('join new user ' + user.displayName);
		makeBoard();
	});
	socket.on('member',function(mem){
		var m;
		if(mem !== undefined && mem.members !== undefined){
			console.log('member');
			for(var i in mem.members){
				m = mem.members[i];
				members[m.displayName] = m;
				console.log('has member ' , m);
			}
			makeBoard();
		}
		else{
			console.log('mem is null');
		}
	});

	// 初期化
	/*
	$('#roomBtn').css('font-weight','bold');	
	$('#friendBase').hide();
	*/
	// DOMアイテムをキャッシュ
	$header		= $('#headers');
	$tabItem[0] = $('#friendTab');
	$tabItem[1] = $('#roomTab');
	$tabItem[2] = $('#chatTab');
	$tabItem[3] = $('#manageTab');

	$tabBase[0] = $('#friendBase');
	$tabBase[1] = $('#roomBase');
	$tabBase[2] = $('#chatBase');
	$tabBase[3] = $('#manageBase');
	// Friendタブを作成
	$tabBase[0].show();

	// UIイベントハンドラ
	$('div.tabPage').hover(
		function(){
			$(this).css({'background-color':'gray','cursor':'pointer'});// in Action
		},
		function(){
			$(this).css({'background-color':'white','cursor':'normal'});// out Action
		}
	);
	for(i = 0;i < 4;i++){
		(function(arg){
			$tabItem[arg].click(function(){
				if(arg !== tabIndex){
					$tabBase[tabIndex].hide();
					tabIndex = arg;
					$tabBase[arg].show();
					if(arg === 2){
						$header.hide();
					}
					else{
						$header.show();
					}
				}
			});
		})(i);
	}

	// チャットルームリストを表示
	$('#roomBtn').click(function(){
		if(currentMode === 1){
			currentMode = 0;
			$('#friendBase').hide();
			$('#roomBase').show();
			$('#roomBtn').css('font-weight','bold');	
			$('#friendBtn').css('font-weight','normal');	
		}
	});

	// フレンドリストを表示
	$('#friendBtn').click(function(){
		if(currentMode === 0){
			currentMode = 1;
			$('#friendBase').show();
			$('#roomBase').hide();
			$('#roomBtn').css('font-weight','normal');	
			$('#friendBtn').css('font-weight','bold');	
		}
	});

	// 送信ボタン
	$('#btn').click(function(){
		var message = $('#message'),
			msg ;

		console.log(message.val());
		msg = {msg:message.val(),roomId:currentRoomId};
		socket.emit('msg_send', msg);
		$('#message').val("");
	});

	// チャットルーム作成ボタン
	$('#createBtn').click(function(){
		var roomName = $('#roomName'),
			strRoom = roomName.val();
		console.log(strRoom);
		if(strRoom.length > 0){
			socket.emit('msg_createRoom', strRoom);
		}
		$('#roomName').val("");
	});
	
	// フレンド検索ボタン
	$('#searchBtn').click(function(){
		var searchName = $('#friendName').val();
		console.log(searchName);
		if(searchName.length > 0){
			socket.emit('inviteFriend',{friendEmail:searchName});
		}
		$('#friendName').val("");
	});
});
