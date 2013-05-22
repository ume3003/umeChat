require.config({
	paths: {		// 使用するファイル
		 'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min',
		'ioc' : '/javascripts/rq-io',
		'uiparts' : '/javascripts/rq-parts',
		'manage' : '/javascripts/rq-manage'
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});
define(['ioc','uiparts','manage','jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function(ioc,uiparts,manage,$){
	var
		user = undefined,
		i,
		tabIndex = -1,
		headerNumber = [0,0,0,0],
		currentRoom = undefined,
		previousRoom = undefined,
		friendInfo = {},
		roomInfos = {},
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
	$headerNumber	= [$('#friendBody'),$('#roomBody'),$('#chatBody'),$('#manageBody')],
	$detailWin	= $('#detailWin').corner(),	// 詳細表示用ウィンドウ
	$friendItems = [],				// フレンドリストページのフレンドアイテムオブジェクト
	$roomItems = [],				// チャットルームリストページのルームアイテムオブジェクト
	$chatItems = [],
	$manageItems = [],
	someoneSaid = function(msg){
		var cnt = $chatItems[currentRoom].length;
		console.log('ui control function',msg);
		$chatItems[currentRoom][cnt] = setChat(cnt,msg,false);
		$tabBase[2].get(0).scrollTop = $tabBase[2].get(0).scrollHeight;
		updateRoomInfo(msg,currentRoom);
	},
	disconnection = function(msg){
		window.location.reload();
	},
	// TODO:以下UIでの通知処理
	sayNotify = function(msg){
		addHeaderNum(2,1);	// ここどうするか・・・ TODO	
		console.log(msg);
		updateRoomInfo(msg,msg.roomId);
	},
	gotNotifies = function(msg){
		var i,mx;
		console.log('gotNotify',msg);
		if(msg !== undefined){
			for(i = 0,mx = msg.length;i < mx;i++){
				if(msg[i].type === 0 || msg[i].type === 1){
					console.log('gotNotify',i,msg[i]);
					addHeaderNum(0,1);
				}
				else if(msg[i].type === 2){
					addHeaderNum(2,1);
				}
				else{
					addHeaderNum(2,1);
				}
				console.log(msg[i]);
			}
		}
	},
	requestComming = function(msg){
		addHeaderNum(0,1);
		console.log(msg);
	},
	approveComming = function(msg){
		addHeaderNum(0,1);
		console.log(msg);
	},
	invited = function(msg){
		addHeaderNum(1,1);
		console.log(msg);
	},
	newoneJoined = function(msg){
		addHeaderNum(2,1);
		console.log(msg);
	},
	someoneLeft = function(msg){
		console.log(msg);
	},
	startChatWith = function(msg){
		addHeaderNum(1,1);
		console.log(msg);
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
	setHeaderNum = function(index,num){
		headerNumber[index] = num;
		$headerNumber[index].text(num);
	},
	addHeaderNum = function(index,addNum){
		var newVal = headerNumber[index] + addNum;
		setHeaderNum(index,newVal);
	},
	subHeaderNum = function(index,subNum){
		var newVal = headerNumber[index] - subNum;
		setHeaderNum(index,newVal);
	},
	createHeader = function(_user){
		user = _user;
		$('#myPhoto').css('background-image','url(' + user.photo + ')');
		$('#myName').text(user.displayName);
		$('#myEmail').text(user.email);
		$('#myComment').text(user.lastComment);
		$baseHead.show();
	},
	init = function(){
		console.log('init');
		// サーバからの通知のコールバック登録
		ioc.someoneSay(someoneSaid);
		ioc.disconnection(disconnection);
		ioc.gotNotifies(gotNotifies);
		ioc.sayNotify(sayNotify);
		ioc.requestComming(requestComming);
		ioc.approveComming(approveComming);
		ioc.invited(invited);
		ioc.newoneJoined(newoneJoined);
		ioc.someoneLeft(someoneLeft);
		ioc.startChatWith(startChatWith);

		manage.init();
		$tabItem = [$('#friendTab').corner(),$('#roomTab').corner(),$('#chatTab').corner(),$('#manageTab').corner()];
		for(i = 0;i < 4;i++){		
			(function(arg){			// タブ切り替え
				$tabItem[arg].click(function(){	showTab({tab:arg}); });
			})(i);
			$scroll[i] = $tabBase[i].append('<div/>').find(':last');
			setHeaderNum(i,0);
		}
		ioc.getMyInfo(function(_user){
			createHeader(_user);
		});
		getList(0,true);
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
	getOlderChat = function(roomId,oldest){
		var i,sFunc,oldest2;
		ioc.getLog({roomId:roomId,lastAccess:oldest,count:10},function(logs){
			if(logs !== undefined){
				for(i = logs.length -1 ; i >= 0;i--){
					$chatItems[currentRoom][i] = setChat(i,logs[i].chat,true);
				}
			}
			sFunc = function(event){
				if(event.target.scrollTop === 0){
					oldest2 = logs !== undefined ? logs[0].chat.lastAccess : oldest;
					$tabBase[2].unbind('scroll',sFunc);
					getOlderChat(roomId,oldest2);
				}
			};
			if(logs !== undefined && logs[0] !== undefined){
				$tabBase[2].bind('scroll',sFunc);
			}
		});
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
		if(roomInfo.mode === 0){	//  個人チャットモード
			$roomPict.css('background-image','url(' + tgtInfo.photo + ')');
			$roomName.text(tgtInfo.displayName);
			$roomCnt.text('2');
		}
		else{
			for(i = 0;i < roomInfo.member.length;i++){
				if((friendInfo[roomInfo.member[i]]) !== undefined){
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
			var i,j,
				chatCnt = (articles === undefined ? 0 : articles.length),
				lastAcc = undefined;
			// 未読から
			console.log('未読 ',chatCnt);
			subHeaderNum(2,chatCnt);
			lastAcc = chatCnt === 0 ? new Date() : articles[0].lastAccess;
			// 未読＋既読１０行分
			ioc.getLog({roomId:roomInfo._id,lastAccess:lastAcc,count:10 - chatCnt},function(logs){
				var scrollFunc,
					oldest;
				if(logs !== undefined){
					for(i = 0 ; i < logs.length;i++){
						$chatItems[currentRoom][i] = setChat(i,logs[i].chat,false);
					}
				}
				for(i = 0;i < chatCnt;i++){
					j = i + 10 - chatCnt;
					$chatItems[currentRoom][j] = setChat(j,articles[i],false);
				}
				$tabBase[2].get(0).scrollTop = $tabBase[2].get(0).scrollHeight;
				scrollFunc = function(event){
					if(event.target.scrollTop === 0){
						oldest = logs !== undefined ? logs[0].chat.lastAccess : lastAcc;
						$tabBase[2].unbind('scroll',scrollFunc);
						getOlderChat(roomInfo._id,oldest);
					}
				};
				if(chatCnt === 10 || logs !== undefined){
					$tabBase[2].bind('scroll',scrollFunc);
				}
			});
		});
	},
	setFriend = function(i,doc){
		var $listItem = uiparts.createItem({scroll:$scroll[0],height:'52px',listClass:'listDocBox',isPrepend:false});
		doc.$listItem = $listItem;
		friendInfo[doc._id] = doc;
		console.log(doc._id,' in ',friendInfo[doc._id].displayName);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + doc.photo + ')');
		$listItem.append('<div/>').find(':last').addClass('textM flName').text(doc.displayName);
		$listItem.append('<div/>').find(':last').addClass('textS flComm textEllipsis').text(doc.lastComment);
		(function(arg){
			$listItem.click(function(){
				ioc.startChatTo({tgtId:doc._id},function(room){
					if(room !== undefined){
						showTab({tab:2,room:room,tgt:doc});
					}
				});
			});
		})(i);
		return $listItem;
	},
	updateRoomInfo = function(chat,roomId){
		var room = roomInfos[roomId],
			$listItem = room !== undefined ? room.$listItem : undefined,
			$lastSay = $listItem !== undefined ? $listItem.$lastSay : undefined,
			$chatTime = $listItem !== undefined ? $listItem.$chatTime : undefined;
		if($lastSay !== undefined ){
			$lastSay.text(chat.body);
		}
		if($chatTime !== undefined ){
			$chatTime.text(toChatTime(chat.lastAccess));
		}
	},
	setRoom = function(i,room){
		var $listItem = uiparts.createItem({scroll:$scroll[1],height:'52px',listClass:'listDocBox',isPripend:false}),
			userId,
			roomURL,
			roomName = room.name;
		room.$listItem = $listItem;
		roomInfos[room._id] = room;
		
		if(room.mode === 0){
			userId = room.member[0] !== user._id ? room.member[0] : room.member[1];
			roomName = friendInfo[userId].displayName;
			roomURL = friendInfo[userId].photo;
		}

		$listItem.append('<div/>').find(':last').addClass('textM rmName').text(roomName + ' ' + room.member.length);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + roomURL  + ')');
		$listItem.$chatTime = $listItem.append('<div/>').find(':last').addClass('textS rmTime').text(toChatTime(room.lastAccess));
		$listItem.$lastSay  = $listItem.append('<div/>').find(':last').addClass('textS rmComm textEllipsis').text(room.lastSay);
		(function(arg){
			$listItem.click(function(){
				showTab({tab:2,room:room,tgt:friendInfo[userId]});
			});
		})(i);
		return $listItem;
	},
	setChat = function(i,chat,isPrepend){
		var $listItem = uiparts.createItem({isPrepend:isPrepend,scroll:$scroll[2],listClass:'listDock'}),
			$msgItem,
			friend,
			fName = chat.sayid,
			pict = chat.pict,
			height = 14;
		console.log(chat.sayid,' ',user._id);
		if(chat.sayid !== user._id){
			friend = friendInfo[chat.sayid];
			if(friend !== undefined){
				fName	= friend.displayName;
				pict	= friend.photo;
			}
			$listItem.append('<div/>').find(':last').addClass('textS cmName').text(fName);
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textS cmTime').text(toChatTime(chat.lastAccess));

			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsg').text(chat.body);
			height = $msgItem.get(0).clientHeight;
			$listItem.css('height', (27 + height ) + 'px');
		}
		else{
			$listItem.append('<div/>').find(':last').addClass('textS cmTimeMe').text(toChatTime(chat.lastAccess));
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + user.photo + ')');
			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsgMe').text(chat.body);
			height = $msgItem.get(0).clientHeight + 9;
			height = height < 48 ? 48 : height;
			$listItem.css('height', height + 'px');
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
		var $listItem = uiparts.createItem({scroll:$scroll[3],height:'52px',listClass:'listDock',isPrepend:false}),
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
				$chatItems[currentRoom][i] = setChat(i,doc,false);
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
			showTab({tab:arg});
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
				manage.makeList(arg,bShow,createList);
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
	showTab = function(param){
		var arg = param.tab,
			roomId = param.room === undefined ? previousRoom : param.room._id,
			room = param.room;
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
					previousRoom = currentRoom;				// 違うルームに入室する場合にチャットページを再作成するように保存	
					currentRoom = -1;
					break;
				case 3:
					manage.hide();
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
					ioc.openRoom({roomId:roomId},function(success){
						if(success){
							currentRoom = previousRoom;
//							if(roomId != previousRoom){
								makeChatPage(room,param.tgt);
//							}
							showChatBox();
						}
					});
					break;
				case 3:
					manage.show();
					break;
				default:
					break;
			}
			// ページインデックスの更新
			tabIndex = arg;
		}
	};
	return {
		init : init
	};
});
