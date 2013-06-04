require.config({
	paths: {		// 使用するファイル
		'ioc' : '/javascripts/rq-io',
		'uiparts' : '/javascripts/rq-parts',
		'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min'
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});
define(['ioc','uiparts','jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function(ioc,uiparts,$){
	var 
		user,
		friends,
		showTab,
		$parent,
		eventName		= 'click',
		$detailWin		= $('#detailWin'),
		$btn			= $('#actionBtn'),
		$baseHead		= $('#baseheads'),	// 通常のヘッダーオブジェクト
		roomInfos = {},
		$roomItems = [],				// フレンドリストページのフレンドアイテムオブジェクト
	init = function(param){
		var i,im;
		showTab = param.showTab;
		user = param.user;
		friends = param.friends;
		$parent = param.parent[1];
		if(param.eventName !== undefined){
			eventName = param.eventName;
		}
		console.log('rooms init');
		ioc.getInvitedRoomList(function(msg){
			if(msg !== undefined){
				for(i = 0,im = msg.length; i < im; i++){
					setRoom(i,msg[i],$parent);
					console.log(msg[i]);
				}
			}
		});
	},
	addInfo = function(key,info){
		roomInfos[key] = info;
	},
	getInfo = function(key){
		return roomInfos[key];
	},
	removeInfo = function(key){
		delete roomInfos(key);
	},
	updateRoomInfo = function(chat,roomId){
		var room = getInfo(roomId),
			$listItem = room !== undefined ? room.$listItem : undefined;
		if($listItem !== undefined ){
			if($listItem.$lastSay !== undefined){
				$listItem.$lastSay.text(chat.body);
			}
			if($listItem.$chatTime !== undefined){
				$listItem.$chatTime.text(uiparts.toChatTime(chat.lastAccess));
			}
		}
	},
	setRoom = function(num,room,parent){
		var i,im,
			bInvite = true,
			$listItem = uiparts.createItem({scroll:parent,height:'52px',listClass:'listDocBorder',isPripend:false}),
			userId,
			roomURL,
			roomName = room.roomName,
			friendsArray = friends.getArray();

		if(num < 0){
			num = $roomItems.length;
		}
		room.$listItem = $listItem;
		$listItem.room = room;
		$roomItems[num] = $listItem;
		addInfo(room._id,room);
		
		if(room.mode === 0){
			userId = room.member[0] !== user._id ? room.member[0] : room.member[1];
			roomName = friends.getInfo(userId) !== undefined ? friends.getInfo(userId).displayName : userId;
			roomURL = friends.getInfo(userId) !== undefined ? friends.getInfo(userId).phota : 'none.jpg';
			bInvite = false;
		}
		else{
			for(i = 0,im = room.member.length;i < im;i++){
				if(user._id === room.member[i]){
					bInvite = false;
					break;
				}
			}
		}
		$listItem.$name		= $listItem.append('<div/>').find(':last').addClass('textS rmName').text(roomName);
		if(room.roomOwner === user._id && room.mode !== 0){
			$listItem.$name.bind(eventName,function(){
				var $tgt = $(this),
					val = $tgt.text();
				$listItem.$name.focus();
				$listItem.$name.css('background-color','gray');
				$listItem.$name.attr('contenteditable','true');
				$listItem.$name.bind('keypress',function(e){
					if(e.keyCode === 13 && e.shiftKey !== true){
						var newVal = $tgt.text();
						console.log($tgt.text());
						if(newVal.length > 0 && newVal !== val){
							ioc.changeRoomName({roomId:room._id,roomName:newVal},function(msg){
								if(msg === true){
									$tgt.text(newVal);
								}
								else{
									$tgt.text(val);
								}
								$tgt.attr('contenteditable','false');
								$tgt.css('background-color','white');
								$tgt.next().focus();
							});
						}
						else{
							$tgt.text(val);
							$tgt.attr('contenteditable','false');
							$tgt.css('background-color','white');
							$tgt.next().focus();
						}
					}
				});
			});
		}
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + roomURL  + ')');
		$listItem.$count	= $listItem.append('<div/>').find(':last').addClass('textS rmCount').text(room.member.length);
		$listItem.$chatTime = $listItem.append('<div/>').find(':last').addClass('textS rmTime').text(uiparts.toChatTime(room.lastAccess));
		$listItem.$lastSay  = $listItem.append('<div/>').find(':last').addClass('textS rmComm textEllipsis').text(room.lastSay);

		$listItem.$openBtn	= $listItem.append('<div/>').find(':last').addClass('textS rmOBtn').text('開　く');
		$listItem.$openBtn.action = function(){
			if(bInvite){
				ioc.joinRoom({roomId:room._id},function(success){
					deleteLine(num);
					showTab({tab:2,room:room});
				});
				console.log('invited');
			}
			else{
				showTab({tab:2,room:room});
			}
		};
		$listItem.$openBtn.bind(eventName		,$listItem.$openBtn.action);
		uiparts.setDetail($listItem.$lastSay,$detailWin);
		if(!bInvite){
			$listItem.$closeBtn	= $listItem.append('<div/>').find(':last').addClass('textS rmCBtn').text('閉じる');
			$listItem.$invBtn	= $listItem.append('<div/>').find(':last').addClass('textS rmIBtn').text('招　待');
			$listItem.$invList	= $listItem.append('<div/>').find(':last').addClass('textS rmList');
			(function(arg){
				var bShow = false;
				$listItem.$closeBtn.action = function(){
					leaveRoom(num);	
				};
				$listItem.$invList.hideOne = function(){
					uiparts.removeChilds($listItem.$invList.get(0),
						function(child){
							if(child.func !== undefined){
								child.unbind(eventName,child.func);
							}
					});
					$listItem.$invList.hide();
					bShow = false;
				};
				$listItem.$invList.showOne = function(){
					var j,k,jm,km,bAdd,listCnt = 0;
					if(!bShow){
						bShow = true;
						for(j = 0,jm = friendsArray.length;j < jm;j++){
							bAdd = true;
							for(k = 0,km = room.member.length; k < km;k++){
								if(friendsArray[j]._id === room.member[k]){
									bAdd = false;
									break;
								}
							}
							if(bAdd){
								(function(_j){
									li = $listItem.$invList.append('<div/>').find(':last').addClass('textS rmListItem').text(friendsArray[_j].displayName);
									li.func = function(){
										console.log(friendsArray[_j].email);
										ioc.inviteRoom({tgtId:friendsArray[_j]._id,roomId:room._id},function(msg){
											$listItem.$invList.hideOne();
										});
									};
									li.bind(eventName,li.func);
									listCnt++;
								})(j);
							}
						}
						if(listCnt > 0){
							$listItem.$invList.css('height',24 * listCnt);
							$listItem.$invList.show();
						}
					}
					else{
						$listItem.$invList.hideOne();
					}
				};
				$listItem.$invList.closeOne = function(e){		// 移動先が、ボタン、リスト、リストの子ノードだったら閉じない
					if(e.relatedTarget === $listItem.$invBtn.get(0) || e.relatedTarget === $listItem.$invList.get(0)){
						return;
					}
					if(uiparts.hasElement(e.relatedTarget,$listItem.$invList.get(0).children)){
						return;
					}
					$listItem.$invList.hideOne();
				};
				//$listItem.$invList.bind('mouseout'	,$listItem.$invList.closeOne);
				//$listItem.$invBtn.bind('mouseout'	,$listItem.$invList.closeOne);
				$listItem.$invBtn.bind(eventName		,$listItem.$invList.showOne);
				$listItem.$closeBtn.bind(eventName	,$listItem.$closeBtn.action);
			})(num);
		}
	},
	makeList = function(arg,bShow,callback){
		console.log('create room list');
		ioc.getRoomList(function(list){
			callback(arg,list,bShow);
		});
	},
	deleteLine = function(index){
		var $item = $roomItems[index],
			room,
			parent;
		if($item !== undefined){
			parent = $item[0].parentNode;
			room = $item.room;
			if(parent !== undefined){
				parent.removeChild($item[0]);
				$roomItems.slice(index,1);
				delete roomInfos[room._id];
			}
		}
	},
	leaveRoom = function(index){
		var $item = $roomItems[index],
			room;
		if($item !== undefined){
			room = $item.room;
			if(room !== undefined){
				console.log($item);
				uiparts.showDlg({
					text : room.roomName + 'を閉じます',	
					btns : [{text : 'ok',
							callback : function(){
								ioc.leaveRoom({roomId:room._id},function(msg){
									deleteLine(index);
									uiparts.closeDlg();
								});
							}},
							{
							text : 'cancel',
							callback : function(){
								uiparts.closeDlg();
							}}
						]
				});
			}
		}
	},
	addRoom = function(){
		// DBに部屋を追加してリストに追加
		console.log('DBと通信');
		uiparts.showDlg(
			{text : '新しくチャットルームを作成します',
			 btns : [{text : 'ok',
					  callback : 
						function(){
							ioc.createRoom({name:'新規作成'},function(msg){
								if(msg !== undefined && msg.room !== undefined){
									setRoom(-1,msg.room,$parent);
								}
								uiparts.closeDlg();
							});
						}
					},
					{text : 'cancel',
					 callback : 
						function(){
							uiparts.closeDlg();
						}
					}]
			}
		);
	},
	show = function(){
		$baseHead.show();
		$btn.text('追加').show().bind(eventName,addRoom);
	},
	hide = function(){
		$baseHead.hide();
		$btn.unbind(eventName,addRoom).hide();
	};
	return {
		init : init,
		updateRoomInfo : updateRoomInfo,
		makeList : makeList,
		setLine : setRoom,
		getInfo : getInfo,
		show : show,
		hide : hide
	};
});
