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
		eventName		= 'cklick',
		$baseHead		= $('#baseheads'),	// 通常のヘッダーオブジェクト
		$manageBox		= $('#newFriendBox'),
		$manageInput	= $('#newFriend'),
		$manageBtn		= $('#newFriendAdd'),
		$manageItems = [],

	init = function(param){
		console.log('manage init');
		if(param.eventName !== undefined){
			eventName = param.eventName;
		}
		prepareAddFriendbox();
	},
	deleteManage = function(num,$listItem){
		var parent = $listItem[0].parentNode;
		if(parent !== undefined){
			parent.removeChild($listItem[0]);
			$manageItems.slice(num,1);
		}
	},
	setManage = function(num,manage,parent){
		var $listItem = uiparts.createItem({scroll:parent,height:'52px',listClass:'listDock',isPrepend:false}),
			manageString = {'0':'申請中','1':'申請あり','9':'申請中'};
		console.log(manage);
		if(manage === undefined){
			return ;
		}
		if(manage.stat ==='9'){
			$listItem.append('<div/>').find(':last').addClass('textS mnEntry').text(manage.user_id);
		}
		$listItem.append('<div/>').find(':last').addClass('textS mnName').text(manage.email);

		$listItem.$status = $listItem.append('<div/>').find(':last');
		$listItem.$status.addClass('textS mnStatus').text(manageString[manage.stat]);
		(function(arg){
			$listItem.$status.click(function(){
				console.log(manage._id,manage.email,manage.stat);
				if(manage.stat === '1'){// TODO:申請承認処理
					uiparts.showDlg({text:manage.email + 'からのフレンド申請を承認します',
						btns : [ { text:'ok',eventName:eventName,callback:function(){
							ioc.approveFriend(manage,function(success){
								if(success){
									console.log('approval success',manage);
									deleteManage(arg,$listItem);
									// TODO:フレンドリストに入れる
								}
								uiparts.closeDlg();
							});
						}},
						{text:'cancel',eventName:eventName,callback:function(){
							uiparts.closeDlg();
						}}
					]});
				}
				else{	// 0か9
					uiparts.showDlg({text:manage.email + 'へのフレンド申請を取り消します',
						btns : [ { text:'ok',eventName:eventName,callback:function(){
							ioc.cancelFriend(manage,function(success){
								if(success){
									console.log('cancel success',manage);
									deleteManage(arg,$listItem);
								}
								uiparts.closeDlg();
							});
						}},
						{text:'cancel',eventName:eventName,callback:function(){
							uiparts.closeDlg();
						}}
					]});
				}
			});
		})(num);
		$manageItems[num] =  $listItem;
	},
	prepareAddFriendbox = function(){
		$manageBtn.click(function(){
			var addFriend = $manageInput.val();
			if(addFriend.length > 0){
				uiparts.showDlg(
					{text :  addFriend + 'を検索します',
						btns: [	{text : 'ok',eventName:eventName,callback : 
							function(){ 
								ioc.requestFriend(addFriend,function(addedFriendInfo){
									var num = $manageItems.length;
									if(addedFriendInfo !== undefined){
										setManage(num,addedFriendInfo);
									}
									else{
										console.log('not foound' , addFriend);
									}
								});
								uiparts.closeDlg();
								$manageInput.val('');
							}},
							{text : 'cancel',eventName:eventName,callback : 
							function(){
								uiparts.closeDlg();
								$manageInput.val('');
							}}
						]
					});
			}
		});
	},
	makeList = function(arg,bShow,callback){
		ioc.getManageList(function(list){
			console.log(list);
			callback(arg,list,bShow);
		});
	},
	show = function(){
		$manageBox.show();
		$baseHead.show();
		$manageInput.focus();
	},
	hide = function(){
		$baseHead.hide();
		$manageBox.hide();
	};
	return {
		init : init,
		setLine : setManage,
		makeList : makeList,
		show : show,
		hide : hide
	};
});
