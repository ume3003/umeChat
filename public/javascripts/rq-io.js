require.config({
	paths: {		// 使用するファイル
		'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min',
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});
define(['jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function($){
	var socket,
		cbks = {},
		findFriendCallback = [],
		getFriendListCallback = undefined,
	init = function(param){
		console.log('connect to server');
		socket = io.connect();
		// サーバから切断された場合。
		// TODO:ウィンドウを再読み込みしてトップに移動してるけど、ui側でやりたい
		socket.on('disconnect',function(msg){
			console.log('disconnect');
			window.location.reload();
		});
		// サーバから帰ってきた申請者、申請中リストをコールバックへ
		socket.on('gotInviteList',function(msg){
			if(cbks.ManageList !== undefined){
				cbks.ManageList(msg.invite);
				cbks.ManageList = undefined;
			}
		});
		// サーバから帰ってきたフレンドリストをコールバックへ
		socket.on('gotFriendList',function(msg){
			if(getFriendListCallback !== undefined){
				getFriendListCallback(msg.friends);
				getFriendListCallback = undefined;
			}
		});
		// 検索したユーザーがいたかの返答
		socket.on('foundFriend',function(msg){
			if(findFriendCallback[msg.tgt] !== undefined){
				findFriendCallback[msg.tgt](msg.you);
				findFriendCallback[msg.tgt] = undefined;
			}
		});
		// 申請承認結果
		socket.on('approvedFriend',function(msg){
			if(cbks.approveFriend !== undefined){
				cbks.approveFriend(msg.success);
				cbks.approveFriend = undefined;
			}
		});
		socket.on('cancelledFriend',function(msg){
			if(cbks.cancelFriend !== undefined){
				cbks.cancelFriend(msg.success);
				cbks.cancelFriend = undefined;
			}
		});
		socket.on('directedMessage',function(msg){
			console.log(msg);
		});
	},
	logout = function(){
		socket.emit('disconnect');
	},
	getSocket = function(){
		return socket;
	},
	// manageで文字列をいれたメールアドレスがユーザーにいるか検索。
	// いない場合はエントリーコードをつくって返してくれる
	findFriend = function(findString,callback){
		if(findFriendCallback[findString] === undefined){
			findFriendCallback[findString] = callback;
			socket.emit('findFriend',{'tgt':findString});
		}
	},
	// フレンドの一覧を取得
	getFriendList = function(callback){
		console.log('getFriendList');
		if(getFriendListCallback === undefined ){
			getFriendListCallback = callback;
			socket.emit('getFriendList');
		}
	},
	// TODO:作成
	getRoomList = function(callback){
		var list = [
			{'id':'001','name':'上野の部屋','cnt':2,'lastChat':'マッカラン','lastTime':'16:00','pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰三','cnt':5,'lastChat':'マッカラン','lastTime':'昨日','pict':'/images/macallan.jpg'}
			];
		callback(list);
	},
	// TODO:作成
	getChatList = function(callback){
		var list = [];
		callback(list);
	},
	approveFriend = function(manage,callback){
		if(cbks.approveFriend === undefined){
			cbks.approveFriend = callback;
			socket.emit('approveFriend',{info:manage});
		}
	},
	cancelFriend = function(manage,callback){
		if(cbks.cancelFriend === undefined){
			cbks.cancelFriend = callback;
			socket.emit('cancelFriend',{info:manage});
		}
	},
	// 申請中または、申請してきているユーザーの一覧を取得
	getManageList = function(callback){
		if(cbks.ManageList === undefined ){
			cbks.ManageList = callback;
			socket.emit('getInviteList');
		}
	};
	return {
		init : init,
		logout : logout,
		cancelFriend : cancelFriend,
		approveFriend : approveFriend,
		findFriend : findFriend,
		getFriendList : getFriendList,
		getRoomList : getRoomList,
		getChatList : getChatList,
		getManageList : getManageList,
		getSocket : getSocket
	};
});
