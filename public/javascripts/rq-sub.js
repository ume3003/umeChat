require.config({
	paths: {		// 使用するファイル
		 'jquery' : '//code.jquery.com/jquery-1.9.1'
		,'jquery.corner' : '/javascripts/jquery.corner'
		,'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min'
		,'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min'
	},
	shim:	{		// 依存関係
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});

define(['jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],
	function($){
		var 
			$tabItem = [$('#friendTab').corner(),$('#roomTab').corner(),$('#chatTab').corner(),$('#manageTab').corner()]
		,	$tabBase = [$('#friendBase'),$('#roomBase'),$('chatBase'),$('#manageBase')]
		;
	}
);

