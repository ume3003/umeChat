define(function(){
	var socket,
	init = function(param){
		console.log('connect to server');
		socket = io.connect();
		socket.on('disconnect',function(msg){
			console.log('disconnect');
			window.location.reload();
		});
	},
	logout = function(){
		socket.emit('disconnect');
	},
	getSocket = function(){
		return socket;
	},
	getFriendList = function(callback){
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
			{'id':'010','name':'上野　彰三','comments':'たま'			,'pict':'/images/tama.jpg'},
	];
		console.log('getFriendList');
		callback(list);
	},
	getRoomList = function(callback){
		var list = [
			{'id':'001','name':'上野の部屋','cnt':2,'lastChat':'マッカラン','lastTime':'16:00','pict':'/images/macallan.jpg'},
			{'id':'002','name':'上野　彰三','cnt':5,'lastChat':'マッカラン','lastTime':'昨日','pict':'/images/macallan.jpg'},
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
			{'id':'002','name':'上野　彰二','status':'0'	,'pict':'/images/strongzero.jpg'},
			];
		callback(list);
	};
	return {
		init : init,
		logout : logout,
		getFriendList : getFriendList,
		getRoomList : getRoomList,
		getChatList : getChatList,
		getManageList : getManageList,
		getSocket : getSocket
	};
});
