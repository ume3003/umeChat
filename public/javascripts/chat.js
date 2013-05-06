$(function(){
	var socket = io.connect()
		/*	new val */
		// サンプルアイテム
		,testFriends = [
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
		]
		,testRooms = [
			{'id':'001','name':'上野の部屋','cnt':2,'lastChat':'マッカラン','lastTime':'16:00','pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰三','cnt':5,'lastChat':'マッカラン','lastTime':'昨日','pict':'/images/macallan.jpg'},
		]
		,testManages = [
			{'id':'001','name':'上野　彰一','status':'0'	,'pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰二','status':'0'	,'pict':'/images/strongzero.jpg'},
		]
		,testMessages = [
			{'id':'001','name':'上野　彰一','sayTime':'16:10'	,'pict':'/images/macallan.jpg','msg':'チャットのメッセージ。ながい文章だとどうなるか。二行三行四行もっとテキストが必要。これでどうだろうか。このくらい。','flag':'0'},
			{'id':'002','name':'上野　彰二','sayTime':'昨日'	,'pict':'/images/strongzero.jpg','msg':'それなんてくそげ','flag':'1'},
		]
		,i
		,tabIndex = 0					// 現在のタブのインデックス
		,$tabItem = {}					// タブオブジェクト
		,$tabBase = {}					// タブごとに表示するオブジェクト
		,$scroll  = {}					// スクロール用のオブジェクト
		,$baseHead 	= $('#baseheads')	// 通常のヘッダーオブジェクト
		,$chatHead	= $('#chatheads')	// チャットページ用のヘッダーオブジェクト
		,$roomPict	= $('#roomPict')
		,$roomName	= $('#roomName')
		,$roomCnt	= $('#roomCnt')
		,$detailWin	= $('#detailWin').corner()	// 詳細表示用ウィンドウ
		,$chatBox	= $('#chatBox')
			,$chatEntry = $('#chatEntry')
			,$chatCommit= $('#chatCommit')
		,$manageBox	= $('#newFriendBox')
			,$manageInput = $('#newFriend')
			,$manageBtn = $('#newFriendAdd')
		,$friendItems = {}				// フレンドリストページのフレンドアイテムオブジェクト
		,$roomItems = {}				// チャットルームリストページのルームアイテムオブジェクト
		,$chatItems = {}
		,$manageItems = {}
		,$dlg = $('dlg')
			,$dlgText = $('dlgText')
		,cssOver = {'background-color':'#aa0','cursor':'pointer'}
		,cssOut  = {'background-color':'white','cursor':'normal'}
		// ここから関数
		,showManageBox = function(){
			$manageInput.focus();
		}
		,showChatBox = function(){
			for(i = 0;i < testMessages.length;i++){
				$chatItems[i] = appendChatItem($scroll,i,testMessages[i]);
			}
			$tabBase[2].jScrollPane(
				{	verticalDragMinHeight: 20,
					verticalDragMaxHeight: 20,
					horizontalDragMinWidth: 20,
					horizontalDragMaxWidth: 20}
			);	
			$chatBox.show();
			$chatEntry.focus();
		}
		// タブを切り替えたときの動作
		,changeTab = function(arg,callback){
			if(arg !== tabIndex && tabIndex >= 0 && tabIndex < 4){
				// 事前のページの非表示
				$tabBase[tabIndex].hide();
				switch(tabIndex){
					case 0:
					case 1:
						$baseHead.hide();
						break;
					case 2:
						$chatHead.hide();
						$chatBox.hide();
						break;
					case 3:
						$baseHead.hide();
						$manageBox.hide();
						break;
					default:
						break;
				}
				// 事後のページの表示
				$tabBase[arg].show();
				switch(arg){
					case 0:
					case 1:
						$baseHead.show();
						break;
					case 2:
						$chatHead.show();
						showChatBox();
						break;
					case 3:
						$manageBox.show();
						$baseHead.show();
						showManageBox();
						break;
					default:
						break;
				}
				// ページインデックスの更新
				tabIndex = arg;
				callback();
			}
		}
		,createItem = function($scroll,num,height,listClass){
			var $listItem = $scroll[num].append('<div/>').find(':last');	// タブのリスト本体
			$listItem.addClass(listClass);
			if(height !== undefined){  $listItem.css({'height':height}); }
			return $listItem;
		},
		appendFriendItem = function($scroll,i,friend){
			var $listItem = createItem($scroll,0,'52px','listDocBox');
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + friend.pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textM flName').text(friend.name);
			$listItem.append('<div/>').find(':last').addClass('textS flComm textEllipsis').text(friend.comments);
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
		appendRoomItem = function($scroll,i,room){
			var $listItem = createItem($scroll,1,'52px','listDocBox');
			$listItem.append('<div/>').find(':last').addClass('textM rmName').text(room.name + ' ' + room.cnt);
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + room.pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textS rmTime').text(room.lastTime);
			$listItem.append('<div/>').find(':last').addClass('textS rmComm textEllipsis').text(room.lastChat);
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
		appendChatItem = function($scroll,i,chat){
			var $listItem = createItem($scroll,2,undefined,'listDock'),
				$msgItem,
				height = 14;
			if(chat.flag === '0'){
				$listItem.append('<div/>').find(':last').addClass('textS cmName').text(chat.name);
				$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + chat.pict + ')');
				$listItem.append('<div/>').find(':last').addClass('textS cmTime').text(chat.sayTime);

				$msgItem = $listItem.append('<div/>').find(':last').corner();
				$msgItem.addClass('textC cmMsg').text(chat.msg);
				height = $msgItem.get(0).clientHeight;
				$listItem.css('height', (27 + height ) + 'px');
			}
			else{
				$listItem.append('<div/>').find(':last').addClass('textS cmTimeMe').text(chat.sayTime);
				$msgItem = $listItem.append('<div/>').find(':last').corner();
				$msgItem.addClass('textC cmMsgMe').text(chat.msg);
				height = $msgItem.get(0).clientHeight;
				$listItem.css('height', (9 + height ) + 'px');
			}
			return $listItem;
		},
		appendManageItem = function($scroll,i,manage){
			var $listItem = createItem($scroll,3,'52px','listDock');
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + manage.pict + ')');
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
			if(parent !== undefined){
				parent.removeChild($listItem[0]);
			}
		},
		createChatHeader = function(roomItem){
			$roomPict.css('background-image','url(' + roomItem.pict + ')');
			$roomName.text(roomItem.name);
			$roomCnt.text(roomItem.cnt);
		};
	// DOMアイテムをキャッシュ

	$tabItem[0] = $('#friendTab').corner();
	$tabItem[1] = $('#roomTab').corner();
	$tabItem[2] = $('#chatTab').corner();
	$tabItem[3] = $('#manageTab').corner();

	$tabBase[0] = $('#friendBase');
	$tabBase[1] = $('#roomBase');
	$tabBase[2] = $('#chatBase');
	$tabBase[3] = $('#manageBase');

	// header 作成 
	// ベースのヘッダーは表示するだけ。データはサーバで埋め込まれる
	$baseHead.show();
	// チャットのヘッダーはチャットルームにより毎回埋め込む
	createChatHeader(testRooms[0]);
	// 各タブアイテムを作成
	for(i = 0;i < 4;i++){
		$scroll[i] = $tabBase[i].append('<div/>').find(':last');
	}
	// Friendタブを作成

	$tabBase[0].hide();
	for(i=0;i < testFriends.length;i++){
		$friendItems[i] = appendFriendItem($scroll,i,testFriends[i]);
	}
	$tabBase[0].show();
	// roomタブを作成
	for(i = 0 ; i < testRooms.length;i++){
		$roomItems[i] = appendRoomItem($scroll,i,testRooms[i]);
	}
	// manageタブを作成
	for(i = 0;i < testManages.length;i++){
		$manageItems[i] = appendManageItem($scroll,i,testManages[i]);
	}
	// chatタブを作成
	// この時点では作成しない
	// サンプル
	/*
	for(i = 0;i < testMessages.length;i++){
		$chatItems[i] = appendChatItem($scroll,i,testMessages[i]);
	}
	*/
	// イベントハンドラ
	$chatEntry.keypress(function(event){
		var $area = $(this);
		if(event.keyCode === 13){
			if(event.shiftKey !== true){
				$(this).val("");
				$(this).get(0).setSelectionRange(0,0);
				$(this).focus();
				event.preventDefault();
			}
		}
			
	});
	$manageBtn.click(function(){
		var val = $manageInput.val();
		console.log(val);
		$manageInput.val('');
	});

	$('div.textEllipsis').hover(
		function(){ 
			console.log($(this).get(0).clientHeight);
			$detailWin.text($(this).text());
			var pos = $(this).offset();
			$detailWin.css({'top': pos.top + $(this).height() + 'px','left':(pos.left + 10) + 'px'});
			$detailWin.show();
		},
		function(){
			$detailWin.hide();

		});
	for(i = 0;i < 4;i++){		// タブ切り替え
		if( i !== 2){
			$tabBase[i].jScrollPane(
				{	verticalDragMinHeight: 20,
					verticalDragMaxHeight: 20,
					horizontalDragMinWidth: 20,
					horizontalDragMaxWidth: 20}
			);	
		}
		(function(arg){
			$tabItem[arg].click(function(){	changeTab(arg,function(){}); });
		})(i);
	}

	///////////////////////////////////////////////////////
	//	ここからソケット処理
	//
	//
	socket.on('disconnect',function(msg){
		console.log('disconnect');		// サーバからきれたらトップへリロード
		window.location.reload();
	});

});

