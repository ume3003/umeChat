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
		console.log(socket);
		/*
		 *
		 *
		 * サーバからの受信コールバック
		 */
		// 申請中リスト取得のコールバック
		socket.on('gotInviteList',function(msg){
			if(cbks.ManageList !== undefined){
				cbks.ManageList(msg.invite);
				cbks.ManageList = undefined;
			}
		});
		// フレンドリスト取得のコールバック
		socket.on('gotFriendList',function(msg){
			if(cbks.getFriendList !== undefined){
				cbks.getFriendList(msg.friends);
				cbks.getFriendList = undefined;
			}
		});
		// フレンド申請のコールバック
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
		// フレンド解消のコールバック
		socket.on('cancelledFriend',function(msg){
			if(cbks.cancelFriend !== undefined){
				cbks.cancelFriend(msg.success);
				cbks.cancelFriend = undefined;
			}
		});
		// 通知を読んだコールバック
		socket.on('redNotify',function(msg){
			if(cbks.readNotify !== undefined){
				cbks.readNotify(msg);
				cbks.readNotify = undefined;
			}
		});
		//チャットに永続的に入室したコールバック
		socket.on('joinedRoom',function(msg){
			if(cbks.joinRoom !== undefined){
				cbks.joinRoom(msg);
				cbks.joinRoom = undefined;
			}
		});
		//  チャットから永続的に退室したコールバック
		socket.on('leftRoom',function(msg){
			if(cbks.leaveRoom !== undefined){
				cbks.leaveRoom(msg);
				cbks.leaveRoom = undefined;
			}
		});
		// チャット招待したコールバック
		socket.on('invitedRoom',function(msg){
			if(cbks.inviteRoom !== undefined){
				cbks.inviteRoom(msg);
				cbks.inviteRoom = undefined;
			}
		});
		// ルーム画像変更コールバック
		socket.on('changedRoomPhoto',function(msg){
			if(cbks.changeRoomPhoto !== undefined){
				cbks.changeRoomPhoto(msg);
				cbks.changeRoomPhoto = undefined;
			}
		});
		// ルーム名変更コールバック
		socket.on('changedRoomName',function(msg){
			if(cbks.changeRoomName !== undefined){
				cbks.changeRoomName(msg);
				cbks.changeRoomName = undefined;
			}
		});
		// チャットを開いたコールバック
		socket.on('openedRoom',function(msg){
			if(cbks.openRoom !== undefined){
				cbks.openRoom(msg);
				cbks.openRoom = undefined;
			}
		});
		// チャットを閉じたコールバック
		socket.on('closedRoom',function(msg){
			if(cbks.closeRoom !== undefined){
				cbks.closeRoom(msg);
				cbks.closeRoom = undefined;
			}
		});
		// チャットルーム作成のコールバック
		socket.on('createdRoom',function(msg){
			if(cbks.createRoom !== undefined){
				cbks.createRoom(msg);
				cbks.createRoom = undefined;
			}
		});
		// １対１チャット開始のコールバック
		socket.on('startedChatTo',function(msg){
			if(cbks.startChatTo !== undefined){
				cbks.startChatTo(msg);
				cbks.startChatTo = undefined;
			}
		});
		// 未読チャットの取得のコールバック
		socket.on('gotUnreadChat',function(msg){
			if(cbks.getUnreadChat !== undefined){
				cbks.getUnreadChat(msg.notify);
				cbks.getUnreadChat = undefined;
			}
		});
		// チャットの発言のコールバック
		socket.on('saidChat',function(msg){
			if(cbks.sayChat !== undefined){
				cbks.sayChat(msg);
				cbks.sayChat = undefined;
			}
		});
		// 既読ログの取得のコールバック
		socket.on('gotLog',function(msg){
			if(cbks.getLog !== undefined){
				cbks.getLog(msg);
				cbks.getLog = undefined;
			}
		});
		// 自分の情報を取得したコールバック
		socket.on('gotMyInfo',function(msg){
			if(cbks.getMyInfo !== undefined){
				cbks.getMyInfo(msg);
				cbks.getMyInfo = undefined;
			}
		});
		// ルームリストの取得のコールバック
		socket.on('gotRoomList',function(msg){
			if(cbks.getRoomList !== undefined){
				cbks.getRoomList(msg);
				cbks.getRoomList = undefined;
			}
		});
		socket.on('gotInvitedRoomList',function(msg){
			if(cbks.getInvitedRoomList !== undefined){
				cbks.getInvitedRoomList(msg);
				cbks.getInvitedRoomList = undefined;
			}
		});
		/*
		 * 登録されているサーバからの通信のUIへのプロクシ
		 */
		// だれかの発言の通知（チャットルームを開いていない）
		socket.on('sayNotify',function(msg){
			if(cbks.sayNotify !== undefined){
				cbks.sayNotify(msg);
			}
		});
		// だれかの発言の配信（チャットルームを開いている）
		socket.on('someoneSaid',function(msg){
			if(cbks.someoneSay !== undefined){
				cbks.someoneSay(msg);
			}
		});
		// 未ログインのときの通知の配信
		socket.on('gotNotifies',function(msg){
			if(cbks.gotNotifies !== undefined){
				cbks.gotNotifies(msg);
			}
		});
		// サーバからの切断時の配信
		socket.on('disconnect',function(msg){
			if(cbks.disconnection !== undefined){
				cbks.disconnection(msg);
			}
		});
		socket.on('requestComming',function(msg){
			if(cbks.requestComming !== undefined){
				cbks.requestComming(msg);
			}
		});
		socket.on('approveComming',function(msg){
			if(cbks.approveComming !== undefined){
				cbks.approveComming(msg);
			}
		});
		socket.on('invited',function(msg){
			if(cbks.invited !== undefined){
				cbks.invited(msg);
			}
		});
		socket.on('newoneJoined',function(msg){
			if(cbks.newoneJoined !== undefined){
				cbks.newoneJoined(msg);
			}
		});
		socket.on('someoneLeft',function(msg){
			if(cbks.someoneLeft !== undefined){
				cbks.someoneLeft(msg);
			}
		});
		socket.on('startChatWith',function(msg){
			if(cbks.startChatWith !== undefined){
				cbks.startChatWith(msg);
			}
		});
		/*
		socket.on('',function(msg){
			if(cbks. !== undefined){
				cbks.(msg);
				cbks. = undefined;
			}
		});
		*/
	},
	logout = function(){
		socket.emit('disconnect');
	},
	getSocket = function(){
		return socket;
	},
	/*
	 *	サーバへの送信メソッド
	 *
	 */
	// サーバから自分の情報を取得する
	getMyInfo = function(callback){
		if(cbks.getMyInfo === undefined){
			cbks.getMyInfo = callback;
			socket.emit('getMyInfo',undefined);
		}
	}
	// 通知を読んだことをサーバに送信
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
	getInvitedRoomList = function(callback){
		if(cbks.getInvitedRoomList === undefined){
			cbks.getInvitedRoomList = callback;
			socket.emit('getInvitedRoomList');

		}
	},
	// チャットルームのリスト表示
	getRoomList = function(callback){
		if(cbks.getRoomList === undefined ){
			cbks.getRoomList = callback;
			socket.emit('getRoomList');
		}
	},
	//　友人承認
	approveFriend = function(manage,callback){
		if(cbks.approveFriend === undefined){
			cbks.approveFriend = callback;
			socket.emit('approveFriend',{info:manage});
		}
	},
	// 友人解除
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
	createRoom = function(msg,callback){
		if(cbks.createRoom === undefined){
			cbks.createRoom = callback;
			socket.emit('createRoom',msg);
		}
	},
	changeRoomPhoto = function(msg,callback){
		if(cbks.changeRoomPhoto === undefined){
			cbks.changeRoomPhoto = callback;
			socket.emit('changeRoomPhoto',msg);
		}
	},
	changeRoomName = function(msg,callback){
		if(cbks.changeRoomName === undefined){
			cbks.changeRoomName = callback;
			socket.emit('changeRoomName',msg);
		}
	},
	// チャットルームへの招待
	inviteRoom = function(msg,callback){
		if(cbks.inviteRoom === undefined){
			cbks.inviteRoom = callback;
			socket.emit('inviteRoom',msg);
		}
	},
	// チャットルームへの永続的ログイン
	joinRoom = function(msg,callback){
		if(cbks.joinRoom === undefined){
			cbks.joinRoom = callback;
			socket.emit('joinRoom',msg);
		}
	},
	// チャットルームからの永続的ログアウト
	leaveRoom = function(msg,callback){
		if(cbks.leaveRoom === undefined){
			cbks.leaveRoom = callback;
			socket.emit('leaveRoom',msg);
		}
	},
	//チャットルームへの入室
	openRoom = function(msg,callback){
		if(cbks.openRoom === undefined){
			cbks.openRoom = callback;
			socket.emit('openRoom',msg);
		}
	},
	// チャットルームからの退室
	closeRoom = function(msg,callback){
		if(cbks.closeRoom === undefined){
			cbks.closeRoom = callback;
			socket.emit('closeRoom',msg);
		}
	},
	// １対１チャットの開始
	startChatTo = function(msg,callback){
		if(cbks.startChatTo === undefined){
			cbks.startChatTo = callback;
			socket.emit('startChatTo',msg);
		}
	},
	// 未読チャットの取得
	getUnreadChat = function(msg,callback){
		if(cbks.getUnreadChat === undefined){
			cbks.getUnreadChat = callback;
			socket.emit('getUnreadChat',msg);
		}
	},
	// 既読チャットの取得
	getLog = function(msg,callback){
		if(cbks.getLog === undefined){
			cbks.getLog = callback;
			socket.emit('getLog',msg);
		}
	},
	// チャットの発言
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
	// 通知の取得のコールバックの登録
	sayNotify = function(callback){
		cbks.sayNotify = callback;
	};
	// 未ログイン時の通知取得のコールバックの登録
	gotNotifies = function(callback){
		cbks.gotNotifies = callback;
	};
	// チャットの取得コールバックの登録
	someoneSay = function(callback){
		cbks.someoneSay = callback;
	};
	// 切断処理のコールバックの登録
	disconnection = function(callback){
		cbks.disconnection = callback;
	};
	requestComming = function(callback){
		cbks.requestComming = callback;
	};
	approveComming = function(callback){
		cbks.approveComming = callback;
	};
	invited = function(callback){
		cbks.invited = callback;
	};
	newoneJoined = function(callback){
		cbks.newownJoined = callback;
	};
	someoneLeft = function(callback){
		cbks.someoneLeft = callback;
	};
	startChatWith = function(callback){
		cbks.startChatWith = callback;
	};
	return {
		init : init,
		someoneSay : someoneSay,
		disconnection : disconnection,
		sayNotify : sayNotify,
		gotNotifies : gotNotifies,
		requestComming : requestComming,	
		approveComming : approveComming,
		invited : invited,			
		newoneJoined : newoneJoined,
		someoneLeft : someoneLeft,	
		startChatWith : startChatWith,
		getMyInfo : getMyInfo,
		logout : logout,
		readNotify : readNotify,
		cancelFriend : cancelFriend,
		approveFriend : approveFriend,
		requestFriend : requestFriend,
		createRoom : createRoom,
		inviteRoom : inviteRoom,
		joinRoom : joinRoom,
		leaveRoom : leaveRoom,
		changeRoomName : changeRoomName,
		changeRoomPhoto : changeRoomPhoto,
		openRoom : openRoom,
		closeRoom : closeRoom,
		startChatTo : startChatTo,
		getUnreadChat : getUnreadChat,
		getLog : getLog,
		sayChat : sayChat,
		getInvitedRoomList : getInvitedRoomList,
		getFriendList : getFriendList,
		getRoomList : getRoomList,
		getManageList : getManageList,

		getSocket : getSocket
	};
});
