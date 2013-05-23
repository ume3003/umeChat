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
		$baseHead		= $('#baseheads'),	// 通常のヘッダーオブジェクト
		roomInfos = {},
		$roomItems = [],				// フレンドリストページのフレンドアイテムオブジェクト
	init = function(param){
		showTab = param.showTab;
		user = param.user;
		friends = param.friends;
		console.log('rooms init');
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
		var $listItem = uiparts.createItem({scroll:parent,height:'52px',listClass:'listDocBox',isPripend:false}),
			userId,
			roomURL,
			roomName = room.name;
		room.$listItem = $listItem;
		$roomItems[num] = $listItem;
		addInfo(room._id,room);
		
		if(room.mode === 0){
			userId = room.member[0] !== user._id ? room.member[0] : room.member[1];
			roomName = friends.getInfo(userId) !== undefined ? friends.getInfo(userId).displayName : userId;
			roomURL = friends.getInfo(userId) !== undefined ? friends.getInfo(userId).phota : 'none.jpg';
		}

		$listItem.append('<div/>').find(':last').addClass('textM rmName').text(roomName + ' ' + room.member.length);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + roomURL  + ')');
		$listItem.$chatTime = $listItem.append('<div/>').find(':last').addClass('textS rmTime').text(uiparts.toChatTime(room.lastAccess));
		$listItem.$lastSay  = $listItem.append('<div/>').find(':last').addClass('textS rmComm textEllipsis').text(room.lastSay);
		(function(arg){
			$listItem.click(function(){
				showTab({tab:2,room:room});
			});
		})(num);
	},
	makeList = function(arg,bShow,callback){
		console.log('create room list');
		ioc.getRoomList(function(list){
			callback(arg,list,bShow);
		});
	},
	show = function(){
		$baseHead.show();
	},
	hide = function(){
		$baseHead.hide();
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
