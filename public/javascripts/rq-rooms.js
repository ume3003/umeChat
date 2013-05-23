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
		$btn			= $('#actionBtn'),
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
		var $listItem = uiparts.createItem({scroll:parent,height:'52px',listClass:'listDoc border1',isPripend:false}),
			userId,
			roomURL,
			roomName = room.name,
			friendsArray = friends.getArray();
			
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
		$listItem.$openBtn	= $listItem.append('<div/>').find(':last').addClass('textS rmOBtn').text('開く');
		$listItem.$invBtn	= $listItem.append('<div/>').find(':last').addClass('textS rmIBtn').text('招待');
		$listItem.$invList	= $listItem.append('<div/>').find(':last').addClass('textS rmList');
		(function(arg){
			$listItem.$openBtn.click(function(){
				showTab({tab:2,room:room});
			});
			$listItem.$invBtn.click(function(){
				var j;
				console.log(friendsArray.length);
				for(j = 0;j < friendsArray.length;j++){
					(function(_j){
						li = $listItem.$invList.append('<div/>').find(':last').addClass('textS rmListItem').text(friendsArray[_j].displayName);
						li.click(function(){
							console.log(friendsArray[_j].email);
							var p = $listItem.$invList.get(0);
							while(p.hasChildNodes()){
								p.removeChild(p.firstChild);
							}
							$listItem.$invList.hide();

						});
					})(j)
					console.log(friendsArray[j]);
				}
				$listItem.$invList.show();
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
		$btn.text('追加');
		$btn.show();
	},
	hide = function(){
		$baseHead.hide();
		$btn.hide();
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
