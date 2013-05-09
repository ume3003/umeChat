require.config({
	paths: {		// 使用するファイル
		 'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min',
		'ioc' : '/javascripts/rq-io',
		'uiparts' : '/javascripts/rq-parts'
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});
define(['ioc','uiparts','jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function(ioc,uiparts,$){
	var
		i,
		tabIndex = -1,
		$tabItem,
		$scroll  = {},					// スクロール用のオブジェクト
		$tabBase	= [$('#friendBase'),$('#roomBase'),$('chatBase'),$('#manageBase')],
		$baseHead 	= $('#baseheads'),	// 通常のヘッダーオブジェクト
		$chatHead	= $('#chatheads'),	// チャットページ用のヘッダーオブジェクト
	$chatBox		= $('#chatBox'),
		$chatEntry = $('#chatEntry'),
		$chatCommit= $('#chatCommit'),
	$manageBox		= $('#newFriendBox'),
		$manageInput = $('#newFriend'),
		$manageBtn = $('#newFriendAdd'),
	$friendItems = [],				// フレンドリストページのフレンドアイテムオブジェクト
	$roomItems = [],				// チャットルームリストページのルームアイテムオブジェクト
	$chatItems = [],
	$manageItems = [],
	prepareAddFriendbox = function(){
		$manageBtn.click(function(){
			var addFriend = $manageInput.val();
			if(addFriend.length > 0){
				uiparts.showDlg(
					{text :  addFriend + 'を検索します',
						btns: [	{text : 'ok',callback : 
							function(){ 
								ioc.findFriend(addFriend,function(addedFriend){
									var num = $manageItems.length;
									if(addedFriend !== undefined){
										$manageItems[num] = setManage($manageItems.length,addedFriend);
									}
									else{
										console.log('not foound' , addFriend);
									}
								});
								uiparts.closeDlg();
								$manageInput.val('');
							}},
							{text : 'cancel',callback : 
							function(){
								console.log('cancelled');
								uiparts.closeDlg();
								$manageInput.val('');
							}}
						]
					});
			}
		});
	},
	init = function(){
		console.log('init');
		$tabItem = [$('#friendTab').corner(),$('#roomTab').corner(),$('#chatTab').corner(),$('#manageTab').corner()];
		for(i = 0;i < 4;i++){		// タブ切り替え
			(function(arg){
				$tabItem[arg].click(function(){	showTab(arg,function(){}); });
			})(i);
		}
		for(i = 0;i < 4;i++){
			$scroll[i] = $tabBase[i].append('<div/>').find(':last');
		}
		getList(0,true);
		getList(1,false);
		console.log('getList 3');
		getList(3,false);
		$baseHead.show();
		
		prepareAddFriendbox();
	},
	createItem = function(num,height,listClass){
		var $listItem = $scroll[num].append('<div/>').find(':last');	// タブのリスト本体
		$listItem.addClass(listClass);
		if(height !== undefined){  $listItem.css({'height':height}); }
		return $listItem;
	},
	setFriend = function(i,doc){
		var $listItem = createItem(0,'52px','listDocBox');
		console.log(doc);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + doc.photo + ')');
		$listItem.append('<div/>').find(':last').addClass('textM flName').text(doc.displayName);
		$listItem.append('<div/>').find(':last').addClass('textS flComm textEllipsis').text(doc.comment);
		(function(arg){
			$listItem.click(function(){
				uiparts.showDlg(
					{text : doc.name ,
						btns: [	{text : 'ok',callback : 
							function(){ 
								console.log(doc.email);
								uiparts.closeDlg();
							}},
							{text : 'cancel',callback : 
							function(){
								console.log(doc.email);
								uiparts.closeDlg();
							}}
						]
					});
			});
			$listItem.dblclick(function(){
				showTab(2,function(){ // TODO:開いたチャットの内容の取得
					console.log(arg,doc.user_id);
				});
			});
		})(i);
		return $listItem;
	},
	setRoom = function(i,room){
		var $listItem = createItem(1,'52px','listDocBox');
		$listItem.append('<div/>').find(':last').addClass('textM rmName').text(room.name + ' ' + room.cnt);
		$listItem.append('<div/>').find(':last').addClass('listPhoto photoM').css('background-image','url(' + room.pict + ')');
		$listItem.append('<div/>').find(':last').addClass('textS rmTime').text(room.lastTime);
		$listItem.append('<div/>').find(':last').addClass('textS rmComm textEllipsis').text(room.lastChat);
		(function(arg){
			$listItem.click(function(){
				// TODO:ここはメニュー
			});
			$listItem.dblclick(function(){
				changeTab(2,function(){	// TODO:ひらいたチャットの内容の取得
					console.log(arg,room.id);
				});
			});
		})(i);
		return $listItem;
	},
	setChat = function(i,chat){
		var $listItem = createItem(2,undefined,'listDock'),
			$msgItem,
			height = 14;
		if(chat.flag === '0'){
			$listItem.append('<div/>').find(':last').addClass('textS cmName').text(chat.name);
			$listItem.append('<div/>').find(':last').addClass('listPhoto photoS').css('background-image','url(' + chat.pict + ')');
			$listItem.append('<div/>').find(':last').addClass('textS cmTime').text(chat.sayTime);

			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsg').text(chat.msg);
			height = $msgItem.get(0).clientHeight;
			$listItem.css('height', (27 + height ) + 'px');
		}
		else{
			$listItem.append('<div/>').find(':last').addClass('textS cmTimeMe').text(chat.sayTime);
			$msgItem = $listItem.append('<div/>').find(':last').corner();
			$msgItem.addClass('textC cmMsgMe').text(chat.msg);
			height = $msgItem.get(0).clientHeight;
			$listItem.css('height', (9 + height ) + 'px');
		}
		return $listItem;
	},
	// TODO: ちゃんと削除できるようにつくる
	deleteManage = function(num,$listItem){
		var parent = $listItem[0].parentNode;
		if(parent !== undefined){
			parent.removeChild($listItem[0]);
			$manageItems.slice(num,1);
		}
	},
	setManage = function(i,manage){
		var $listItem = createItem(3,'52px','listDock'),
			manageString = {'0':'申請中','1':'申請あり','9':'申請中'};
		if(manage.stat ==='9'){
			$listItem.append('<div/>').find(':last').addClass('textS mnEntry').text(manage.user_id);
		}
		$listItem.append('<div/>').find(':last').addClass('textS mnName').text(manage.email);

		$listItem.$status = $listItem.append('<div/>').find(':last');
		$listItem.$status.addClass('textS mnStatus').text(manageString[manage.stat]);
		(function(arg){
			$listItem.$status.click(function(){
				console.log(manage.id,manage.email,manage.stat);
				if(manage.stat === '1'){// TODO:申請承認処理
					uiparts.showDlg({text:manage.email + 'からのフレンド申請を承認します',
						btns : [ { text:'ok',callback:function(){
							ioc.approveFriend(manage,function(success){
								if(success){
									console.log('approval success',manage);
									deleteManage(arg,$listItem);
									// TODO:フレンドリストに入れる
								}
								uiparts.closeDlg();
							});
						}},
						{text:'cancel',callback:function(){
							uiparts.closeDlg();
						}}
					]});
				}
				else{	// 0か9
					uiparts.showDlg({text:manage.email + 'へのフレンド申請を取り消します',
						btns : [ { text:'ok',callback:function(){
							ioc.cancelFriend(manage,function(success){
								if(success){
									console.log('cancel success',manage);
									deleteManage(arg,$listItem);
								}
								uiparts.closeDlg();
							});
						}},
						{text:'cancel',callback:function(){
							uiparts.closeDlg();
						}}
					]});
				}
			});
		})(i);
		return $listItem;
	},
	addList = function(arg,i,doc){
		switch(arg){
			case 0:
				$friendItems[i] = setFriend(i,doc);
				break;
			case 1:
				setRoom(i,doc);
				break;
			case 2:
				setChat(i,doc);
				break;
			case 3:
				$manageItems[i] = setManage(i,doc);
				break;
			default:
				break;
		}
	},
	createList = function(arg,list,bShow){
		if(list !== undefined && list.length > 0){
			for(i = 0; i < list.length;i++){
				addList(arg,i,list[i]);
			}
		}
		if(bShow){
			console.log('showTab',arg);
			showTab(arg,function(){console.log('create list');});
		}
	},
	getList = function(arg,bShow){
		switch(arg){
			case 0:
				ioc.getFriendList(function(list){
					createList(arg,list,bShow);
				});
				break;
			case 1:
				ioc.getRoomList(function(list){
					createList(arg,list,bShow);
				});
				break;
			case 2:
				ioc.getChatList(function(list){
					createList(arg,list,bShow);
				});
				break;
			case 3:
				ioc.getManageList(function(list){
					createList(arg,list,bShow);
				});
				break;
			default:
				break;
		}
	},
	showChatBox = function(){
		$chatHead.show();
		$chatBox.show();
		$chatEntry.focus();
	},
	showManageBox = function(){
		$manageBox.show();
		$baseHead.show();
		$manageInput.focus();
	},
	showTab = function(arg,callback){
		console.log('showTab ' , arg);
		if(arg !== tabIndex ){
			// 事前のページの非表示
			if(tabIndex >= 0 && tabIndex < 4){
				$tabBase[tabIndex].hide();
			}
			switch(tabIndex){
				case 0:
				case 1:
					$baseHead.hide();
					break;
				case 2:
					$chatHead.hide();
					$chatBox.hide();
					break;
				case 3:
					$baseHead.hide();
					$manageBox.hide();
					break;
				default:
					break;
			}
			// 事後のページの表示
			$tabBase[arg].show();
			switch(arg){
				case 0:
				case 1:
					$baseHead.show();
					break;
				case 2:
					showChatBox();
					break;
				case 3:
					showManageBox();
					break;
				default:
					break;
			}
			// ページインデックスの更新
			tabIndex = arg;
			if(callback !== undefined){
				callback();
			}
		}
	};
	return {
		init : init,
		showTab : showTab,
	};
});
