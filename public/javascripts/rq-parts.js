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
	return {	showDlg : showDlg,	closeDlg : closeDlg};
});