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
		cbks = {};
		cbks.requestFriend = {};

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
			if(cbks.getFriendList !== undefined){
				cbks.getFriendList(msg.friends);
				cbks.getFriendList = undefined;
			}
		});
		// 検索したユーザーがいたかの返答
		socket.on('requestedFriend',function(msg){
			if(cbks.requestFriend[msg.tgt] !== undefined){
				cbks.requestFriend[msg.tgt](msg.you);
				cbks.requestFriend[msg.tgt] = undefined;
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
		socket.on('redNotify',function(msg){
			if(cbks.readNotify !== undefined){
				cbks.readNotify(msg);
				cbks.readNotify = undefined;
			}
			console.log(msg);
		});
		socket.on('joinedRoom',function(msg){
			if(cbks.joinRoom !== undefined){
				cbks.joinRoom(msg);
				cbks.joinRoom = undefined;
			}
		});
		socket.on('leftRoom',function(msg){
			if(cbks.leftRoom !== undefined){
				cbks.leftRoom(msg);
				cbks.leftRoom = undefined;
			}
		});
		socket.on('openedRoom',function(msg){
			if(cbks.openRoom !== undefined){
				cbks.openRoom(msg);
				cbks.openRoom = undefined;
			}
		});
		socket.on('closedRoom',function(msg){
			if(cbks.closeRoom !== undefined){
				cbks.closeRoom(msg);
				cbks.closeRoom = undefined;
			}
		});
		socket.on('createdRoom',function(msg){
			if(cbks.createRoom !== undefined){
				cbks.createRoom(msg);
				cbks.createRoom = undefined;
			}
		});
		socket.on('startedChatTo',function(msg){
			if(cbks.startChatTo !== undefined){
				cbks.startChatTo(msg);
				cbks.startChatTo = undefined;
			}
		});
		socket.on('gotUnreadChat',function(msg){
			if(cbks.getUnreadChat !== undefined){
				cbks.getUnreadChat(msg.notify);
				cbks.getUnreadChat = undefined;
			}
		});
		socket.on('saidChat',function(msg){
			if(cbks.sayChat !== undefined){
				cbks.sayChat(msg);
				cbks.sayChat = undefined;
			}
		});
		socket.on('gotLog',function(msg){
			if(cbks.getLog !== undefined){
				cbks.getLog(msg);
				cbks.getLog = undefined;
			}
		});
		socket.on('gotMyInfo',function(msg){
			console.log('gotmyInfo ' ,msg);
			if(cbks.getMyInfo !== undefined){
				cbks.getMyInfo(msg);
				cbks.getMyInfo = undefined;
			}
		});
		socket.on('someoneSaid',function(msg){
			cbks.saidChat(msg);
			console.log('someoneSaid',msg);
		});
		socket.on('sayNotify',function(msg){
			console.log('sayNotify',msg);
		});
		/*
		socket.on('',function(msg){
			if(cbks. !== undefined){
				cbks.(msg);
				cbks. = undefined;
			}
		});
		*/
		socket.on('directedMessage',function(msg){
			console.log('directMessage',msg);
		});
		socket.on('gotNotify',function(msg){
			console.log('gotNotify',msg);
		});
	},
	logout = function(){
		socket.emit('disconnect');
	},
	getSocket = function(){
		return socket;
	},
	getMyInfo = function(callback){
		if(cbks.getMyInfo === undefined){
			cbks.getMyInfo = callback;
			socket.emit('getMyInfo',undefined);
		}
	}
	readNotify = function(notifyIds,callback){
		if(cbks.readNotify === undefined){
			cbks.readNotify = callback;
			socket.emit('readNotify',{article:notifyIds});
		}
	},
	// フレンドの一覧を取得
	getFriendList = function(callback){
		if(cbks.getFriendList === undefined ){
			cbks.getFriendList = callback;
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
	// manageで文字列をいれたメールアドレスがユーザーにいるか検索。
	// いない場合はエントリーコードをつくって返してくれる
	requestFriend = function(findString,callback){
		if(cbks.requestFriend[findString] === undefined){
			cbks.requestFriend[findString] = callback;
			socket.emit('requestFriend',{'tgt':findString});
		}
	},
	inviteRoom = function(msg,callback){
		if(cbks.inviteRoom === undefined){
			cbks.inviteRoom = callback;
			socket.emit('inviteRoom',msg);
		}
	},
	joinRoom = function(msg,callback){
		if(cbks.joinRoom === undefined){
			cbks.joinRoom = callback;
			socket.emit('joinRoom',msg);
		}
	},
	leaveRoom = function(msg,callback){
		if(cbks.leaveRoom === undefined){
			cbks.leaveRoom = callback;
			socket.emit('leaveRoom',msg);
		}
	},
	openRoom = function(msg,callback){
		if(cbks.openRoom === undefined){
			cbks.openRoom = callback;
			socket.emit('openRoom',msg);
		}
	},
	closeRoom = function(msg,callback){
		if(cbks.closeRoom === undefined){
			cbks.closeRoom = callback;
			socket.emit('closeRoom',msg);
		}
	},
	startChatTo = function(msg,callback){
		if(cbks.startChatTo === undefined){
			cbks.startChatTo = callback;
			socket.emit('startChatTo',msg);
		}
	},
	getUnreadChat = function(msg,callback){
		if(cbks.getUnreadChat === undefined){
			cbks.getUnreadChat = callback;
			socket.emit('getUnreadChat',msg);
		}
	},
	getLog = function(msg,callback){
		if(cbks.getLog === undefined){
			cbks.getLog = callback;
			socket.emit('getLog',msg);
		}
	},
	sayChat = function(msg,callback){
		if(cbks.sayChat === undefined){
			cbks.sayChat = callback;
			console.log('now send to server ',msg);
			socket.emit('sayChat',msg);
		}
	},
	// 申請中または、申請してきているユーザーの一覧を取得
	getManageList = function(callback){
		if(cbks.ManageList === undefined ){
			cbks.ManageList = callback;
			socket.emit('getInviteList');
		}
	};
	saidChat = function(callback){
		cbks.saidChat = callback;
	};
	return {
		init : init,
		saidChat : saidChat,
		getMyInfo : getMyInfo,
		logout : logout,
		readNotify : readNotify,
		cancelFriend : cancelFriend,
		approveFriend : approveFriend,
		requestFriend : requestFriend,
		inviteRoom : inviteRoom,
		joinRoom : joinRoom,
		leaveRoom : leaveRoom,
		openRoom : openRoom,
		cloeRoom : closeRoom,
		startChatTo : startChatTo,
		getUnreadChat : getUnreadChat,
		getLog : getLog,
		sayChat : sayChat,
		getFriendList : getFriendList,
		getRoomList : getRoomList,
		getChatList : getChatList,
		getManageList : getManageList,
		getSocket : getSocket
	};
});
