var slowlyCloseTab_setting = {
	accept : function(){
		// ダイアログからは直接 gBrowser はとれない
		/*
		var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getMostRecentWindow("navigator:browser")
			.getBrowser();

		slowlyCloseTab.addMenuItems(browser);
		*/
		var browsers = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getEnumerator('navigator:browser');
		while( browsers.hasMoreElements() ){
			var browser = browsers.getNext();
			browser = browser.QueryInterface(Components.interfaces.nsIDOMWindowInternal);

			slowlyCloseTab.addMenuItems(browser.getBrowser());
		}
		return true;
	}
};
