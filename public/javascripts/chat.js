$(function(){
	var socket = io.connect()
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
// ここから
	var 
	/*	new val */
		i
		,tabIndex = 0					// 現在のタブのインデックス
		,$tabItem = {}					// タブオブジェクト
		,$tabBase = {}					// タブごとに表示するオブジェクト
		,$scroll  = {}					// スクロール用のオブジェクト
		,$baseHead 	= $('#baseheads')	// 通常のヘッダーオブジェクト
		,$chatHead	= $('#chatheads')	// チャットページ用のヘッダーオブジェクト
		,$detailWin	= $('#detailWin')	// 詳細表示用ウィンドウ
		,$friendItems = {}				// フレンドリストページのフレンドアイテムオブジェクト
		,$roomItems = {}				// チャットルームリストページのルームアイテムオブジェクト
		,$chatItems = {}
		,$manageItems = {}
		,cssOver = {'background-color':'#aa0','cursor':'pointer'}
		,cssOut  = {'background-color':'white','cursor':'normal'}
		// ここから関数
		// タブを切り替えたときの動作
		,changeTab = function(arg,callback){
			if(arg !== tabIndex && tabIndex >= 0 && tabIndex < 4){
				$tabBase[tabIndex].hide();
				tabIndex = arg;
				$tabBase[arg].show();
				if(arg === 2){
					$baseHead.hide();
					$chatHead.show();
				}
				else{
					$baseHead.show();
					$chatHead.hide();
				}
				callback();
			}
		}
		,createItem = function($scroll,num,height,cOver,cOut){

			var $listItem = $scroll[num].append('<div/>').find(':last');	// タブのリスト本体
			$listItem.addClass('listDock');
			if(height !== undefined){  $listItem.css({'height':height}); }
			if(cOver !== undefined){
				$listItem.hover(
				function(){	$(this).css(cOver);	},	// in Action
				function(){	$(this).css(cOut);	});// out Action
			}
			return $listItem;
		},
		appendFriendItem = function($scroll,i,friend,cOver,cOut){
			var $listItem = createItem($scroll,0,'40px',cOver,cOut);
			$listItem.append('<div/>').find(':last')
				.addClass('listPhoto photoS flPhoto').css('background-image','url(' + friend.pict + ')');
			$listItem.append('<div/>').find(':last')
				.addClass('textM flName').text(friend.name);
			$listItem.append('<div/>').find(':last')
				.addClass('textS flComm textEllipsis').text(friend.comments);
			(function(arg){
				$listItem.click(function(){
					// TODO:ここはメニュー
				});
				$listItem.dblclick(function(){
					changeTab(2,function(){ // TODO:開いたチャットの内容の取得
						console.log(arg,friend.id);
					});
				});
			})(i);
			return $listItem;
		},
		appendRoomItem = function($scroll,i,room,cOver,cOut){
			var $listItem = createItem($scroll,1,'40px',cOver,cOut);
			$listItem.append('<div/>').find(':last')
				.addClass('textM flName').text(room.name + ' ' + room.cnt);
			$listItem.append('<div/>').find(':last')
				.addClass('listPhoto photoS flPhoto').css('background-image','url(' + room.pict + ')');
			$listItem.append('<div/>').find(':last')
				.addClass('textS rmTime').text(room.lastTime);
			$listItem.append('<div/>').find(':last')
				.addClass('textS flComm textEllipsis').text(room.lastChat);
			(function(arg){
				$listItem.click(function(){
					// TODO:ここはメニュー
				});
				$listItem.dblclick(function(){
					changeTab(2,function(){	// TODO:ひらいたチャットの内容の取得
						console.log(arg,room.id);
					});
				});
			})(i);
			return $listItem;
		},
		appendChatItem = function($scroll,i,chat,cOver,cOut){
			var $listItem = createItem($scroll,2,undefined,cOver,cOut),
				$msgItem,height;
			$listItem.append('<div/>').find(':last')
				.addClass('textS flName').text(chat.name);
			$listItem.append('<div/>').find(':last')
				.addClass('listPhoto photoS flPhoto').css('background-image','url(' + chat.pict + ')');
			$listItem.append('<div/>').find(':last')
				.addClass('textS rmTime').text(chat.sayTime);
			$msgItem = $listItem.append('<div/>').find(':last');
			$msgItem.addClass('textS chMsg').text(chat.msg);
			console.log($msgItem.attr('scrollHeight'));
			
			return $listItem;
		},
		appendManageItem = function($scroll,i,manage,cOver,cOut){
			var $listItem = createItem($scroll,3,'40px',cOver,cOut);
			$listItem.append('<div/>').find(':last')
				.addClass('listPhoto photoS flPhoto').css('background-image','url(' + manage.pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textM mnName').text(manage.name);

			$listItem.$status = $listItem.append('<div/>').find(':last');
			$listItem.$status.addClass('textM mnStatus').text(manage.status === '0' ? '申請する' : '申請中');
			(function(arg){
				$listItem.$status.click(function(){
					if(manage.status === '0'){
						// TODO:送信処理
						manage.status = '1';
						console.log(manage.id,manage.name,manage.status);
						changeManageStatus(arg,manage,$listItem);		// TODO:通信のコールバックで指定
					}
					else{
						deleteManageItem($listItem);
					}
				});
			})(i);
			return $listItem;
		},
		changeManageStatus = function(i,manage,$listItem){
			if(	$listItem.$status !== undefined){
				$listItem.$status.text(manage.status === '0' ? '申請する' : '申請中');
			}
		},
		deleteManageItem = function($listItem){
			var parent = $listItem[0].parentNode;
			parent.removeChild($listItem[0]);
		};
	// DOMアイテムをキャッシュ

	$tabItem[0] = $('#friendTab');
	$tabItem[1] = $('#roomTab');
	$tabItem[2] = $('#chatTab');
	$tabItem[3] = $('#manageTab');

	$tabBase[0] = $('#friendBase');
	$tabBase[1] = $('#roomBase');
	$tabBase[2] = $('#chatBase');
	$tabBase[3] = $('#manageBase');

	// header 作成 
	// ベースのヘッダーは表示するだけ。データはサーバで埋め込まれる
	$baseHead.show();
	// チャットのヘッダーはチャットルームにより毎回埋め込む
//	createChatHeader();
	// 各タブアイテムを作成
	for(i = 0;i < 4;i++){
		$scroll[i] = $tabBase[i].append('<div/>').find(':last');
	}
	// Friendタブを作成
	// サンプルアイテム
	var testFriends = [
		{'id':'001','name':'上野　彰一','comments':'マッカラン'		,'pict':'/images/macallan.jpg'},
		{'id':'002','name':'上野　彰二','comments':'ストロングゼロ'	,'pict':'/images/strongzero.jpg'},
		{'id':'003','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'004','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'005','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'006','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'007','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'008','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'009','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
		{'id':'010','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
	];
	var testRooms = [
		{'id':'001','name':'上野の部屋','cnt':2,'lastChat':'マッカラン','lastTime':'16:00','pict':'/images/macallan.jpg'},
		{'id':'002','name':'上野　彰三','cnt':5,'lastChat':'マッカラン','lastTime':'昨日','pict':'/images/macallan.jpg'},
	];
	var testManages = [
		{'id':'001','name':'上野　彰一','status':'0'	,'pict':'/images/macallan.jpg'},
		{'id':'002','name':'上野　彰二','status':'0'	,'pict':'/images/strongzero.jpg'},
	];
	var testMessages = [
		{'id':'001','name':'上野　彰一','sayTime':'16:1'	,'pict':'/images/macallan.jpg','msg':'チャットのメッセージ。ながい文章だとどうなるか。二行三行四行もっとテキストが必要。これでどうだろうか。このくらい。'},
		{'id':'002','name':'上野　彰二','sayTime':'昨日'	,'pict':'/images/strongzero.jpg','msg':'それなんてくそげ'},
	]
	$tabBase[0].hide();
	for(i=0;i < testFriends.length;i++){
		$friendItems[i] = appendFriendItem($scroll,i,testFriends[i],cssOver,cssOut);
	}
	$tabBase[0].show();
	// roomタブを作成
	for(i = 0 ; i < testRooms.length;i++){
		$roomItems[i] = appendRoomItem($scroll,i,testRooms[i],cssOver,cssOut);
	}
	// manageタブを作成
	for(i = 0;i < testManages.length;i++){
		$manageItems[i] = appendManageItem($scroll,i,testManages[i],cssOver,cssOut);
	}
	// chatタブを作成
	// この時点では作成しない
	// サンプル
	for(i = 0;i < testMessages.length;i++){
		$chatItems[i] = appendChatItem($scroll,i,testMessages[i],cssOver,cssOut);
	}
	// イベントハンドラ
	$('div.tabPage').hover(	// UIイベントハンドラ
		function(){		$(this).css(cssOver);	},// in Action
		function(){		$(this).css(cssOut);	}// out Action
	);
	$('div.textEllipsis').hover(
		function(){ 
			$detailWin.text($(this).text());
			var pos = $(this).offset();
			$detailWin.css({'top': pos.top + $(this).height() + 'px','left':(pos.left + 10) + 'px'});
			$detailWin.show();
		},
		function(){
			$detailWin.hide();

		});
	for(i = 0;i < 4;i++){		// タブ切り替え
		$tabBase[i].jScrollPane(
			{	verticalDragMinHeight: 20,
				verticalDragMaxHeight: 20,
				horizontalDragMinWidth: 20,
				horizontalDragMaxWidth: 20}
		);	
		(function(arg){
			$tabItem[arg].click(function(){	changeTab(arg,function(){}); });
		})(i);
	}
////////////////////////////////////////////
// 再作成
// ////////////////////////////
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

