require.config({
	paths: {		// 使用するファイル
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
define(['jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],function($){
	var $dlg = $('#dlg'),
		$dlgText = $('#dlgText'),
		$dlgBtnBase = $('#dlgBtnBase'),
		defParam = {text : 'sample',
					btns : [{text : 'ok',callback : function(){ closeDlg(); }}]},
		$headerNumber	= [$('#friendBody'),$('#roomBody'),$('#chatBody'),$('#manageBody')],
		headerNumber = [0,0,0,0],
	createItem = function(param){
		var $listItem = param.isPrepend !== undefined && param.isPrepend === true ?
			param.scroll.prepend('<div/>').find(':first'):	// タブのリスト本体
			param.scroll.append('<div/>').find(':last');	// タブのリスト本体

		$listItem.addClass(param.listClass);
		if(param.height !== undefined){  
			$listItem.css({'height':param.height});
		}
		return $listItem;
	},
	setHeaderNum = function(index,num){
		headerNumber[index] = num;
		$headerNumber[index].text(num);
	},
	addHeaderNum = function(index,addNum){
		var newVal = headerNumber[index] + addNum;
		setHeaderNum(index,newVal);
	},
	subHeaderNum = function(index,subNum){
		var newVal = headerNumber[index] - subNum;
		setHeaderNum(index,newVal);
	},
	toChatTime = function(dateString){
		var d = new Date(dateString);
			dString = d.getHours() +  ':' + d.getMinutes();		
		return dString;
	},
	removeChilds = function(parent,unbind){
		if(parent !== undefined){
			while(parent.hasChildNodes()){
				if(unbind !== undefined){
					unbind(parent.firstChild);
				}
				parent.removeChild(parent.firstChild);
			}
		}
	},
	setDetail = function($target,$detailWin){
		$target.hover(
			function(){ 
				if($(this).text().length > 0){
					$detailWin.text($(this).text());
					var pos = $(this).offset();
					$detailWin.css({'top': pos.top + $(this).height() + 'px','left':(pos.left + 10) + 'px'});
					$detailWin.show();
				}
			},
			function(){
				if($(this).text().length > 0){
					$detailWin.hide();
				}
		});
	},
	hasElement = function(ele,children){
		var i;
		if(ele !== undefined && children !== undefined){
			for(i = 0;i < children.length;i++){
				if(ele === children[i]){
					return true;
				}
			}
		}
		return false;
	},
	makeBtns = function(btns){
		var $btn,
			i,
			btnCnt = 1,
			btnWidth = 300;
		btnCnt = btns.length;
		btnWidth = btnWidth / btnCnt;
		for(i = 0 ; i < btnCnt ; i++){
			console.log(btns[i],btnCnt,btnWidth);
			$btn = $dlgBtnBase.append('<div/>').find(':last');
			$btn.addClass('dlgBtn');
			$btn.css('left', (i * btnWidth) + 'px');
			$btn.css('width', btnWidth + 'px');
			$btn.corner();
			(function(arg){
				$btn.click(
					function(){
						btns[arg].callback();
					});
			})(i);
			$btn.text(btns[i].text);
		}
	},
	makeText = function(dlgText){
		$dlgText.text(dlgText);
	},
	showDlg = function(param){
		if(param === undefined){
			param = {};
			param.text = defParam.text;
			param.btns = defParam.btns;
		}
		makeText(param.text);
		makeBtns(param.btns);
		$dlg.show();
	},
	closeDlg = function(){
		console.log('closeDlg');
		$dlgBtnBase.empty();
		$dlg.hide();
	};
	return {	
		toChatTime : toChatTime,
	   setDetail : setDetail,
		removeChilds : removeChilds,
		hasElement : hasElement,
		createItem: createItem,
		setHeaderNum : setHeaderNum,
		addHeaderNum : addHeaderNum,
		subHeaderNum : subHeaderNum,
		showDlg : showDlg,
		closeDlg : closeDlg
	};
});
