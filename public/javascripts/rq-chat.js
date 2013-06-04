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
		eventName = 'click',
		currentRoom = undefined,
		previousRoom = undefined,
		$grandBase = $('#chatBase'),
		$parent,
		$baseHead		= $('#baseheads'),	// 通常のヘッダーオブジェクト
		$chatHead	= $('#chatheads'),	// チャットページ用のヘッダーオブジェクト
		$chatBox	= $('#chatBox'),
		$chatEntry = $('#chatEntry'),
		$chatCommit= $('#chatCommit'),
		$chatItems = [],

	init = function(param){
		console.log('user init');
		user = param.user;
		friends = param.friends;
		$parent = param.parent[2];
		if(param.eventName !== undefined){
			eventName = param.eventName;
		}
		$chatEntry.keypress(function(event){
			var $area = $(this),
				val;
			if(event.keyCode === 13){
				if(event.shiftKey !== true){
					val = $(this).val();
					if(val.length > 0){
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
	},
	makeChatPage = function(roomInfo){
		var $roomPict = $('#roomPict'),
			$roomName = $('#roomName'),
			$roomCnt  = $('#roomCnt'),
			nameText = [],
			tgtInfo,
			i;
		currentRoom = roomInfo._id;
		$chatItems = [];
		if(roomInfo.mode === 0){	//  個人チャットモード
			tgtInfo = friends.getInfo(roomInfo.member[0] === user._id ? roomInfo.member[1] : roomInfo.member[0]);
			$roomPict.css('background-image','url(' + tgtInfo.photo + ')');
			$roomName.text(tgtInfo.displayName);
			$roomCnt.text('2');
		}
		else{
			for(i = 0;i < roomInfo.member.length;i++){
				if((friends.getInfo(roomInfo.member[i])) !== undefined){
					nameText.push(friends.getInfo(roomInfo.member[i]).displayName);
				}
				else{
					nameText.push('unknown');
				}
			}
			$roomName.text(nameText.join(','));
			$roomCnt.text(roomInfo.member.length);
		}
		// 現在のチャットを消す
		var scroll2 = $parent.get(0);
		while(scroll2.hasChildNodes()){
			scroll2.removeChild(scroll2.firstChild);
		}

		// 最新のチャットを取ってくる。
		ioc.getUnreadChat({roomId:roomInfo._id},function(articles){
			var i,j,
				chatCnt = (articles === undefined ? 0 : articles.length),
				lastAcc = undefined;
			uiparts.subHeaderNum(2,chatCnt);
			lastAcc = chatCnt === 0 ? new Date() : articles[0].lastAccess;
			// 未読＋既読１０行分
			console.log(chatCnt);
			console.log(lastAcc);
			ioc.getLog({roomId:roomInfo._id,lastAccess:lastAcc,count:10 - chatCnt},function(logs){
				var scrollFunc,
					oldest;
				if(logs !== undefined){
					for(i = 0 ; i < logs.length;i++){
						setChat(i,logs[i].chat,false);
					}
				}
				for(i = 0;i < chatCnt;i++){
					j = i + 10 - chatCnt;
					setChat(j,articles[i],false);
				}
				scrollToBottom();
				scrollFunc = function(event){
					if(event.target.scrollTop === 0){
						console.log(logs[0]);
						oldest = logs !== undefined ? logs[0].chat.lastAccess : lastAcc;
						$grandBase.unbind('scroll',scrollFunc);
						getOlderChat(roomInfo._id,oldest);
					}
				};
				if(chatCnt === 10 || logs !== undefined){
					$grandBase.bind('scroll',scrollFunc);
				}
			});
		});
	},
	scrollToBottom = function(){
		$grandBase.get(0).scrollTop = $grandBase.get(0).scrollHeight;
	},
	// TODO: ここがあやしい！
	getOlderChat = function(roomId,oldest){
		var i,sFunc,oldest2;
		ioc.getLog({roomId:roomId,lastAccess:oldest,count:10},function(logs){
			if(logs !== undefined){
				for(i = logs.length -1 ; i >= 0;i--){
					setChat(i,logs[i].chat,true);
				}
			}
			sFunc = function(event){
				if(event.target.scrollTop === 0){
					oldest2 = logs !== undefined ? logs[0].chat.lastAccess : oldest;
					$grandBase.unbind('scroll',sFunc);
					getOlderChat(roomId,oldest2);
				}
			};
			if(logs !== undefined && logs[0] !== undefined){
				$grandBase.bind('scroll',sFunc);
			}
		});
	},
	setChat = function(num,chat,isPrepend){
		var $listItem = uiparts.createItem({isPrepend:isPrepend,scroll:$parent,listClass:'listDock'}),
			$msgItem,
			friend,
			fName = chat.sayid,
			pict = chat.pict,
			height = 14;
		if(num < 0){
			num = $chatItems.length;
		}
		$chatItems[num] =  $listItem;

		if(chat.sayid !== user._id){
			friend = friends.getInfo(chat.sayid);
			if(friend !== undefined){
				fName	= friend.displayName;
				pict	= friend.photo;
			}
			$listItem.append('<div/>').find(':last').addClass('textS cmName').text(fName);
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textS cmTime').text(uiparts.toChatTime(chat.lastAccess));

			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsg').text(chat.body);
			height = $msgItem.get(0).clientHeight;
			$listItem.css('height', (27 + height ) + 'px');
		}
		else{
			$listItem.append('<div/>').find(':last').addClass('textS cmTimeMe').text(uiparts.toChatTime(chat.lastAccess));
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + user.photo + ')');
			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsgMe').text(chat.body);
			height = $msgItem.get(0).clientHeight + 9;
			height = height < 48 ? 48 : height;
			$listItem.css('height', height + 'px');
		}
	},
	previous = function(){
		return previousRoom;
	},
	setNext = function(next){
		previousRoom = next;
	},
	current = function(){
		return current;
	},
	show = function(){
		ioc.openRoom({roomId:previousRoom},function(msg){
			if(msg.room){
				currentRoom = previousRoom;
				makeChatPage(msg.room);
				$chatHead.show();
				$chatBox.show();
				$chatEntry.focus();
			}
		});
	},
	hide = function(){
		$chatHead.hide();
		$chatBox.hide();
		ioc.closeRoom({roomId:currentRoom});
		previousRoom = currentRoom;				// 違うルームに入室する場合にチャットページを再作成するように保存	
		currentRoom = -1;
	};
	return {
		init : init,
		setLine : setChat,
		makeChatrPpage : makeChatPage,
		scrollToBottom : scrollToBottom,
		current : current,
		previous : previous,
		setNext : setNext,
		show : show,
		hide : hide
	};
});
