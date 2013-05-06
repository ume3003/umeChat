require.config({
	paths: {		// 使用するファイル
		'jquery' : '//code.jquery.com/jquery-1.9.1',
		'jquery.corner' : '/javascripts/jquery.corner',
		'jquery.mousewheel' : '/javascripts/jquery.mousewheel.min',
		'jquery.jscrollpane' : '/javascripts/jquery.jscrollpane.min',
		'socketio' : '/socket.io/socket.io',
		'ui' : '/javascripts/rq-ui',
		'ioc' : '/javascripts/rq-io'
		 },
	
	shim:	{		// 依存関係
		'socketio' : { exports: 'io' },
		'jquery.corner' : ['jquery'],
		'jquery.mousewheel' : ['jquery'],
		'jquery.jscrollpane' : ['jquery']
	}
});

define(['ui','ioc','socketio','jquery','jquery.corner','jquery.jscrollpane','jquery.mousewheel'],
	function(ui,ioc,io,$){
		var socket;
		

		socket = ioc.init();
		ui.init();
		ui.showTab(0);
		}
);

