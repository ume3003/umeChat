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
		findFriendCallback = [],
		getFriendListCallback,
	init = function(param){
		console.log('connect to server');
		socket = io.connect();
		socket.on('disconnect',function(msg){
			console.log('disconnect');
			window.location.reload();
		});
		socket.on('gotFriendList',function(msg){
			if(getFriendListCallback !== undefined){
				console.log('gotFriendList');
				getFriendListCallback(msg.friends);
				getFriendListCallback = undefined;
			}
		});
		socket.on('foundFriend',function(msg){
			if(findFriendCallback[msg.tgt] !== undefined){
				findFriendCallback[msg.tgt](msg.cnt,
				{'id':msg.you.user_id,'name':msg.you.email,'status':msg.you.status	,'pict':'/images/macallan.jpg'});
				findFriendCallback[msg.tgt] = undefined;
			}
		});
	},
	logout = function(){
		socket.emit('disconnect');
	},
	getSocket = function(){
		return socket;
	},
	findFriend = function(findString,callback){
		console.log('findFriend',findString);
		if(findFriendCallback[findString] === undefined){
			findFriendCallback[findString] = callback;
			socket.emit('findFriend',{'tgt':findString});
		}
	},
	getFriendList = function(callback){
		/*
		var list = [
			{'id':'001','name':'上野　彰一','comments':'マッカラン'		,'pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰二','comments':'ストロングゼロ'	,'pict':'/images/strongzero.jpg'},
			{'id':'003','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'004','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'005','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'006','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'007','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'008','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'009','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
			{'id':'010','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'}
		];*/
		if(getFriendListCallback === undefined ){
			getFriendListCallback = callback;
			console.log('getFriendList');
			socket.emit('getFriendList');
		}
		//callback(list);
	},
	getRoomList = function(callback){
		var list = [
			{'id':'001','name':'上野の部屋','cnt':2,'lastChat':'マッカラン','lastTime':'16:00','pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰三','cnt':5,'lastChat':'マッカラン','lastTime':'昨日','pict':'/images/macallan.jpg'}
			];
		callback(list);
	},
	getChatList = function(callback){
		var list = [];
		callback(list);
	},
	getManageList = function(callback){
		var list = [
			{'id':'001','name':'上野　彰一','status':'0'	,'pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰二','status':'0'	,'pict':'/images/strongzero.jpg'}
			];
		callback(list);
	};
	return {
		init : init,
		logout : logout,
		findFriend : findFriend,
		getFriendList : getFriendList,
		getRoomList : getRoomList,
		getChatList : getChatList,
		getManageList : getManageList,
		getSocket : getSocket
	};
});
