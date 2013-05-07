var slowlyCloseTab_setting = {
	accept : function(){
		// ダイアログからは直接 gBrowser はとれない
		var browser = Components.classes["@mozilla.org/appshell/window-mediator;1"]
			.getService(Components.interfaces.nsIWindowMediator)
			.getMostRecentWindow("navigator:browser")
			.getBrowser();

		slowlyCloseTab_setting.removeMenuItem(browser);
		slowlyCloseTab.addMenuItems(browser);
		return true;
	},
	
	removeMenuItem : function(browser) {
		slowlyCloseTab_setting.removeElement(browser, "tab-removeleftmenu");
		slowlyCloseTab_setting.removeElement(browser, "tab-removerightmenu");
		slowlyCloseTab_setting.removeElement(browser, "tab-removeothermenu");
		slowlyCloseTab_setting.removeElement(browser, "tab-removeallmenu");
	},
	
	removeElement : function(browser, id) {
		var item = browser.ownerDocument.getElementById(id);
		if(item == null){ return; }
		item.parentNode.removeChild(item);
	}
};
