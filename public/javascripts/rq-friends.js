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
		showTab,
		$baseHead		= $('#baseheads'),	// 通常のヘッダーオブジェクト
		friendInfo = {},
		$friendItems = [],				// フレンドリストページのフレンドアイテムオブジェクト
	init = function(param){
		showTab = param.showTab;
		console.log('friends init');
	},
	addInfo = function(key,info){
		friendInfo[key] = info;
	},
	getInfo = function(key){
		return friendInfo[key];
	},
	removeInfo = function(key){
		delete friendInfo[key];
	},
	getFriendsArray = function(){
		var it,list = [];
		for(it in friendInfo){
			list.push(friendInfo[it]);
		}
		return list;
	},
	makeList = function(callback){
		ioc.getFriendList(function(list){
			callback(list);
		});
	},
	setFriend = function(num,doc,parent){
		var $listItem = uiparts.createItem({scroll:parent,height:'52px',listClass:'listDocBox',isPrepend:false});
		doc.$listItem = $listItem;
		addInfo(doc._id,doc);
		$friendItems[num] = $listItem;
		console.log(doc._id,' in ',getInfo(doc._id).displayName);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + doc.photo + ')');
		$listItem.append('<div/>').find(':last').addClass('textM flName').text(doc.displayName);
		$listItem.append('<div/>').find(':last').addClass('textS flComm textEllipsis').text(doc.lastComment);
		(function(arg){
			$listItem.click(function(){
				ioc.startChatTo({tgtId:doc._id},function(room){
					if(room !== undefined){
						showTab({tab:2,room:room});
					}
				});
			});
		})(num);
	},
	show = function(){
		$baseHead.show();
	},
	hide = function(){
		$baseHead.hide();
	};
	return {
		init : init,
		makeList : makeList,
		getArray : getFriendsArray,
		setLine : setFriend,
		getInfo : getInfo,
		show : show,
		hide : hide
	};
});
