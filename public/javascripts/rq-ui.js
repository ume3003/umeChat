require.config({
	paths: {		// 使用するファイル
		 'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min',
		'ioc' : '/javascripts/rq-io',
		'uiparts' : '/javascripts/rq-parts'
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});
define(['ioc','uiparts','jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function(ioc,uiparts,$){
	var
		user = undefined,
		i,
		tabIndex = -1,
		currentRoom = undefined,
		friendInfo = {},
		$tabItem,
		$scroll  = {},					// スクロール用のオブジェクト
		$tabBase	= [$('#friendBase'),$('#roomBase'),$('#chatBase'),$('#manageBase')],
		$baseHead 	= $('#baseheads'),	// 通常のヘッダーオブジェクト
		$chatHead	= $('#chatheads'),	// チャットページ用のヘッダーオブジェクト
	$chatBox		= $('#chatBox'),
		$chatEntry = $('#chatEntry'),
		$chatCommit= $('#chatCommit'),
	$manageBox		= $('#newFriendBox'),
		$manageInput = $('#newFriend'),
		$manageBtn = $('#newFriendAdd'),
	$detailWin	= $('#detailWin').corner(),	// 詳細表示用ウィンドウ
	$friendItems = [],				// フレンドリストページのフレンドアイテムオブジェクト
	$roomItems = [],				// チャットルームリストページのルームアイテムオブジェクト
	$chatItems = [],
	$manageItems = [],
	// TODO:通知の処理
	sayNotify = function(msg){
		console.log(msg);
	},
	// TODO:通知の処理
	gotNotifies = function(msg){
		var i,mx;
		if(msg !== undefined){
			for(i = 0,mx = msg.length;i < mx;i++){
				console.log(msg[i]);
			}
		}
	},
	someoneSaid = function(msg){
		var cnt = $chatItems[currentRoom].length;
		$chatItems[currentRoom][cnt] = setChat(cnt,msg);
		$tabBase[2].get(0).scrollTop = $tabBase[2].get(0).scrollHeight;
	},
	disconnection = function(msg){
		console.log(msg);
		window.location.reload();
	},
	prepareAddFriendbox = function(){
		$manageBtn.click(function(){
			var addFriend = $manageInput.val();
			if(addFriend.length > 0){
				uiparts.showDlg(
					{text :  addFriend + 'を検索します',
						btns: [	{text : 'ok',callback : 
							function(){ 
								ioc.requestFriend(addFriend,function(addedFriend){
									var num = $manageItems.length;
									if(addedFriend !== undefined){
										$manageItems[num] = setManage($manageItems.length,addedFriend);
									}
									else{
										console.log('not foound' , addFriend);
									}
								});
								uiparts.closeDlg();
								$manageInput.val('');
							}},
							{text : 'cancel',callback : 
							function(){
								console.log('cancelled');
								uiparts.closeDlg();
								$manageInput.val('');
							}}
						]
					});
			}
		});
	},
	toChatTime = function(dateString){
		var d = new Date(dateString);
			dString = d.getHours() +  ':' + d.getMinutes();		
		return dString;
	},
	init = function(){
		console.log('init');
		// サーバからの通知のコールバック登録
		ioc.someoneSay(someoneSaid);
		ioc.disconnection(disconnection);
		ioc.gotNotifies(gotNotifies);
		ioc.sayNotify(sayNotify);

		$tabItem = [$('#friendTab').corner(),$('#roomTab').corner(),$('#chatTab').corner(),$('#manageTab').corner()];
		for(i = 0;i < 4;i++){		// タブ切り替え
			(function(arg){
				$tabItem[arg].click(function(){	showTab(arg,function(){}); });
			})(i);
		}
		for(i = 0;i < 4;i++){
			$scroll[i] = $tabBase[i].append('<div/>').find(':last');
		}
		ioc.getMyInfo(function(_user){
			user = _user;
		});
		getList(0,true);
		$baseHead.show();
		prepareAddFriendbox();
		$chatEntry.keypress(function(event){
			var $area = $(this),
				val;
			if(event.keyCode === 13){
				if(event.shiftKey !== true){
					val = $(this).val();
					if(val.length > 0){
						console.log('say:' + $(this).val());
						ioc.sayChat({roomId:currentRoom,msg:val},function(msg){
							console.log('receive myself',msg);
						});
						$(this).val("");
						$(this).get(0).setSelectionRange(0,0);
						$(this).focus();
						event.preventDefault();
					}
				}
			}
				
		});
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
	},
	createItem = function(num,height,listClass){
		var $listItem = $scroll[num].append('<div/>').find(':last');	// タブのリスト本体
		$listItem.addClass(listClass);
		if(height !== undefined){  $listItem.css({'height':height}); }
		return $listItem;
	},
	makeChatPage = function(roomInfo,tgtInfo){
		var $roomPict = $('#roomPict'),
			$roomName = $('#roomName'),
			$roomCnt  = $('#roomCnt'),
			nameText = [],
			i;
		// 最終的にはいろいろキャッシュ。とりあえず、現状は取得	
		currentRoom = roomInfo._id;
		$chatItems[currentRoom] = [];
		// TODO:名前を配列にいれるか、メソッドで取得できるようにする。
		if(roomInfo.mode == 0){	//  個人チャットモード
			$roomPict.css('background-image','url(' + tgtInfo.photo + ')');
			$roomName.text(tgtInfo.displayName);
			$roomCnt.text('2');
		}
		else{
			for(i = 0;i < roomInfo.member.length;i++){
				if(friendInfo[roomInfo.member[i]]) !== undefined){
					nameText.push(friendInfo[roomInfo.member[i].displayName]);
				}
				else{
					nameText.push('unknown');
				}
			}
			$roomName.text(nameText.join(','));
			$roomCnt.text(roomInfo.member.length);
		}
		// 現在のチャットを消す
		var scroll2 = $scroll[2].get(0);
		while(scroll2.hasChildNodes()){
			scroll2.removeChild(scroll2.firstChild);
		}
		// 最新のチャットを取ってくる。
		ioc.getUnreadChat({roomId:roomInfo._id},function(articles){
			var i,
				chatCnt = articles === undefined ? 0 : articles.length,
				lastAcc = undefined;
			// 未読から
			console.log('未読 ',chatCnt);
			lastAcc = chatCnt === 0 ? new Date() : articles[0].lastAccess;
			// 未読＋既読１０行分
			for(i = 0;i < chatCnt;i++){
				$chatItems[currentRoom][i] = setChat(i,articles[i]);
			}
			$tabBase[2].get(0).scrollTop = $tabBase[2].get(0).scrollHeight;
			if(chatCnt < 10){
				ioc.getLog({roomId:roomInfo._id,lastAccess:lastAcc,count:10 - chatCnt},function(logs){
					if(logs !== undefined){
						for(i = 0 ; i < logs.length;i++){
							$chatItems[currentRoom][i+chatCnt] = setChat(i+chatCnt,logs[i].chat);
							$tabBase[2].get(0).scrollTop = $tabBase[2].get(0).scrollHeight;
						}
					}
				});
			}			
		});
	},
	setFriend = function(i,doc){
		var $listItem = createItem(0,'52px','listDocBox');
		friendInfo[doc._id] = doc;
		console.log(doc._id,' in ',friendInfo[doc._id].displayName);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + doc.photo + ')');
		$listItem.append('<div/>').find(':last').addClass('textM flName').text(doc.displayName);
		$listItem.append('<div/>').find(':last').addClass('textS flComm textEllipsis').text(doc.lastComment);
		(function(arg){
			$listItem.click(function(){
				ioc.startChatTo({tgtId:doc._id},function(room){
					if(room !== undefined){
						console.log('FriendClick',room);
						ioc.openRoom({roomId:room._id},function(success){
							if(success){
								makeChatPage(room,doc);
								showTab(2,function(){
									console.log(arg,room);
								});
							}
						});
					}
				});
			});
		})(i);
		return $listItem;
	},
	setRoom = function(i,room){
		var $listItem = createItem(1,'52px','listDocBox'),
			userId,
			roomURL,
			roomName = room.name;;

		if(room.mode === 0){
			userId = room.member[0] !== user.id ? room.member[0] : room.member[1];
			console.log(userId,friendInfo[userId]);
			roomName = friendInfo[userId].displayName;
			roomURL = friendInfo[userId].photo;
		}

		$listItem.append('<div/>').find(':last').addClass('textM rmName').text(roomName + ' ' + room.member.length);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + roomURL  + ')');
		$listItem.append('<div/>').find(':last').addClass('textS rmTime').text(toChatTime(room.lastAccess));
		$listItem.append('<div/>').find(':last').addClass('textS rmComm textEllipsis').text(room.roomOwner);
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
	setChat = function(i,chat){
		var $listItem = createItem(2,undefined,'listDock'),
			$msgItem,
			height = 14;
		console.log(chat.sayid,' ',user._id,' ',user.id);
		if(chat.sayid !== user.id){
			$listItem.append('<div/>').find(':last').addClass('textS cmName').text(chat.sayid);
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + chat.pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textS cmTime').text(toChatTime(chat.lastAccess));

			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsg').text(chat.body);
			height = $msgItem.get(0).clientHeight;
			$listItem.css('height', (27 + height ) + 'px');
		}
		else{
			$listItem.append('<div/>').find(':last').addClass('textS cmTimeMe').text(toChatTime(chat.lastAccess));
			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsgMe').text(chat.body);
			height = $msgItem.get(0).clientHeight;
			$listItem.css('height', (9 + height ) + 'px');
		}
		return $listItem;
	},
	// TODO: ちゃんと削除できるようにつくる
	deleteManage = function(num,$listItem){
		var parent = $listItem[0].parentNode;
		if(parent !== undefined){
			parent.removeChild($listItem[0]);
			$manageItems.slice(num,1);
		}
	},
	setManage = function(i,manage){
		var $listItem = createItem(3,'52px','listDock'),
			manageString = {'0':'申請中','1':'申請あり','9':'申請中'};
		if(manage.stat ==='9'){
			$listItem.append('<div/>').find(':last').addClass('textS mnEntry').text(manage.user_id);
		}
		$listItem.append('<div/>').find(':last').addClass('textS mnName').text(manage.email);

		$listItem.$status = $listItem.append('<div/>').find(':last');
		$listItem.$status.addClass('textS mnStatus').text(manageString[manage.stat]);
		(function(arg){
			$listItem.$status.click(function(){
				console.log(manage.id,manage.email,manage.stat);
				if(manage.stat === '1'){// TODO:申請承認処理
					uiparts.showDlg({text:manage.email + 'からのフレンド申請を承認します',
						btns : [ { text:'ok',callback:function(){
							ioc.approveFriend(manage,function(success){
								if(success){
									console.log('approval success',manage);
									deleteManage(arg,$listItem);
									// TODO:フレンドリストに入れる
								}
								uiparts.closeDlg();
							});
						}},
						{text:'cancel',callback:function(){
							uiparts.closeDlg();
						}}
					]});
				}
				else{	// 0か9
					uiparts.showDlg({text:manage.email + 'へのフレンド申請を取り消します',
						btns : [ { text:'ok',callback:function(){
							ioc.cancelFriend(manage,function(success){
								if(success){
									console.log('cancel success',manage);
									deleteManage(arg,$listItem);
								}
								uiparts.closeDlg();
							});
						}},
						{text:'cancel',callback:function(){
							uiparts.closeDlg();
						}}
					]});
				}
			});
		})(i);
		return $listItem;
	},
	addList = function(arg,i,doc){
		switch(arg){
			case 0:
				$friendItems[i] = setFriend(i,doc);
				break;
			case 1:
				$roomItems[i] = setRoom(i,doc);
				break;
			case 2:
				$chatItems[currentRoom][i] = setChat(i,doc);
				break;
			case 3:
				$manageItems[i] = setManage(i,doc);
				break;
			default:
				break;
		}
	},
	createList = function(arg,list,bShow){
		if(list !== undefined && list.length > 0){
			for(i = 0; i < list.length;i++){
				addList(arg,i,list[i]);
			}
		}
		if(bShow){
			console.log('showTab',arg);
			showTab(arg,function(){console.log('create list');});
		}
	},
	getList = function(arg,bShow){
		switch(arg){
			case 0:
				ioc.getFriendList(function(list){
					createList(arg,list,bShow);
					getList(1,false);
				});
				break;
			case 1:
				ioc.getRoomList(function(list){
					createList(arg,list,bShow);
					getList(3,false);
				});
				break;
			case 2:		// チャットは開くときに都度とる
				break;
			case 3:
				ioc.getManageList(function(list){
					createList(arg,list,bShow);
				});
				break;
			default:
				break;
		}
	},
	showChatBox = function(){
		$chatHead.show();
		$chatBox.show();
		$chatEntry.focus();
	},
	showManageBox = function(){
		$manageBox.show();
		$baseHead.show();
		$manageInput.focus();
	},
	showTab = function(arg,callback){
		console.log('showTab ' , arg);
		if(arg !== tabIndex ){
			// 事前のページの非表示
			if(tabIndex >= 0 && tabIndex < 4){
				$tabBase[tabIndex].hide();
			}
			switch(tabIndex){
				case 0:
				case 1:
					$baseHead.hide();
					break;
				case 2:
					$chatHead.hide();
					$chatBox.hide();
					ioc.closeRoom({roomId:currentRoom});
					currentRoom = -1;
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
					showChatBox();
					break;
				case 3:
					showManageBox();
					break;
				default:
					break;
			}
			// ページインデックスの更新
			tabIndex = arg;
			if(callback !== undefined){
				callback();
			}
		}
	};
	return {
		init : init,
		showTab : showTab,
	};
});
