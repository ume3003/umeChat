require.config({
	paths: {		// 使用するファイル
		 'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min',
		'ioc' : '/javascripts/rq-io',
		'uiparts' : '/javascripts/rq-parts',
		'chat' : '/javascripts/rq-chat',
		'friends' : '/javascripts/rq-friends',
		'rooms' : '/javascripts/rq-rooms',
		'manage' : '/javascripts/rq-manage'
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});
define(['ioc','uiparts','chat','rooms','friends','manage','jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function(ioc,uiparts,chat,rooms,friends,manage,$){
	var
		user = undefined,
		i,
		tabIndex = -1,
		$tabItem,
		$scroll  = {},					// スクロール用のオブジェクト
		tabObj = [friends,rooms,chat,manage],
		$tabBase	= [$('#friendBase'),$('#roomBase'),$('#chatBase'),$('#manageBase')],
		$detailWin	= $('#detailWin').corner(),	// 詳細表示用ウィンドウ

	disconnection = function(msg){
		window.location.reload();
	},
	someoneSaid = function(msg){
		chat.setLine(-1,msg,$scroll[2],false);
		chat.scrollToBottom();
		rooms.updateRoomInfo(msg,chat.current());
	},
	// TODO:以下UIでの通知処理
	sayNotify = function(msg){
		uiparts.addHeaderNum(2,1);	// ここどうするか・・・ TODO	
		rooms.updateRoomInfo(msg,msg.roomId);
	},
	gotNotifies = function(msg){
		var i,mx;
		console.log('gotNotify',msg);
		if(msg !== undefined){
			for(i = 0,mx = msg.length;i < mx;i++){
				if(msg[i].type === 0 || msg[i].type === 1){
					console.log('gotNotify',i,msg[i]);
					uiparts.addHeaderNum(0,1);
				}
				else if(msg[i].type === 2){
					uiparts.addHeaderNum(2,1);
				}
				else{
					uiparts.addHeaderNum(2,1);
				}
				console.log(msg[i]);
			}
		}
	},
	requestComming = function(msg){
		uiparts.addHeaderNum(0,1);
		console.log(msg);
	},
	approveComming = function(msg){
		uiparts.addHeaderNum(0,1);
		console.log(msg);
	},
	invited = function(msg){
		uiparts.addHeaderNum(1,1);
		console.log(msg);
	},
	newoneJoined = function(msg){
		uiparts.addHeaderNum(2,1);
		console.log(msg);
	},
	someoneLeft = function(msg){
		console.log(msg);
	},
	startChatWith = function(msg){
		uiparts.addHeaderNum(1,1);
		console.log(msg);
	},
	createHeader = function(_user){
		$('#myPhoto').css('background-image','url(' + user.photo + ')');
		$('#myName').text(user.displayName);
		$('#myEmail').text(user.email);
		$('#myComment').text(user.lastComment);
		$('#baseheads').show();
	},
	init = function(){
		console.log('init');
		// サーバからの通知のコールバック登録
		ioc.someoneSay(someoneSaid);
		ioc.disconnection(disconnection);
		ioc.gotNotifies(gotNotifies);
		ioc.sayNotify(sayNotify);
		ioc.requestComming(requestComming);
		ioc.approveComming(approveComming);
		ioc.invited(invited);
		ioc.newoneJoined(newoneJoined);
		ioc.someoneLeft(someoneLeft);
		ioc.startChatWith(startChatWith);

		$tabItem = [$('#friendTab').corner(),$('#roomTab').corner(),$('#chatTab').corner(),$('#manageTab').corner()];
		for(i = 0;i < 4;i++){		
			(function(arg){			// タブ切り替え
				$tabItem[arg].click(function(){	showTab({tab:arg}); });
			})(i);
			$scroll[i] = $tabBase[i].append('<div/>').find(':last');
			uiparts.setHeaderNum(i,0);
		}
		ioc.getMyInfo(function(_user){
			var param = {showTab : showTab,user:_user,friends:friends,parent:$scroll};
			user = _user;
			createHeader(_user);
			manage.init(param);
			friends.init(param);
			rooms.init(param);
			chat.init(param);
			friends.makeList(function(list){
				createList(0,list,true);
				rooms.makeList(1,false,createList);
				manage.makeList(3,false,createList);
			});
		});
		$('div.textEllipsis').hover(
			function(){ 
				$detailWin.text($(this).text());
				var pos = $(this).offset();
				$detailWin.css({'top': pos.top + $(this).height() + 'px','left':(pos.left + 10) + 'px'});
				$detailWin.show();
			},
			function(){
				$detailWin.hide();
		});
	},
	addList = function(arg,i,doc){
		switch(arg){
			case 0:
				friends.setLine(i,doc,$scroll[0]);
				break;
			case 1:
				rooms.setLine(i,doc,$scroll[1]);
				break;
			case 2:
				break;
			case 3:
				console.log('set manage');
				manage.setLine(i,doc !== undefined ? doc.friends:undefined,$scroll[3]);
				break;
			default:
				break;
		}
	},
	createList = function(arg,list,bShow){
		console.log('createList ' ,arg);
		if(list !== undefined && list.length > 0){
			for(i = 0; i < list.length;i++){
				addList(arg,i,list[i]);
			}
		}
		if(bShow){
			showTab({tab:arg});
		}
	},
	showTab = function(param){
		var arg = param.tab;
		if(param.room !== undefined){
			chat.setNext(param.room._id);
		}
		console.log('showTab ' , arg,tabIndex);
		if(arg !== tabIndex ){
			// 事前のページの非表示
			if(tabIndex >= 0 && tabIndex < 4){
				$tabBase[tabIndex].hide();
				tabObj[tabIndex].hide();
			}
			// 事後のページの表示
			$tabBase[arg].show();
			tabObj[arg].show();
			// ページインデックスの更新
			tabIndex = arg;
		}
	};
	return {
		init : init
	};
});
