

function slowlyCloseTabLog(aText) {
    var console = Components.classes["@mozilla.org/consoleservice;1"]
            .getService(Components.interfaces.nsIConsoleService);
    console.logStringMessage("slowlyCloseTab: "+aText);
}

var slowlyCloseTab = {
	_removeTab: "removeTabCheck",
	_removeTabCount: 0,
	_removeTabRunMore: false,
	_removeTabRun: false,
	_isRTL : null,
	isRTL : function() {
		if(slowlyCloseTab._isRTL == null){
			var chromedir;
			try{
				var pref = Components.classes["@mozilla.org/preferences-service;1"]
					.getService(Components.interfaces.nsIPrefBranch);
				var locale = pref.getCharPref("general.useragent.locale");
				chromedir = pref.getCharPref("intl.uidirection." + locale);
			}catch(e){}
			slowlyCloseTab._isRTL = (chromedir == "rtl");
		}
		return (slowlyCloseTab._isRTL);
	},

	removeAction : function(){
		if( slowlyCloseTab._removeTabRun === false ){
			slowlyCloseTab.removeTabRun();
		}else {
			slowlyCloseTab._removeTabRunMore = true;
		}
	},

	removeLeft : function(usecontext) {
		var ctab = (usecontext ? gBrowser.mContextTab : gBrowser.selectedTab);
		if(slowlyCloseTab.isRTL()){
			slowlyCloseTab.removeAfter(ctab);
		}else{
			slowlyCloseTab.removeBefore(ctab);
		}
		slowlyCloseTab.removeAction();
	},
	
	removeRight : function(usecontext) {
		var ctab = (usecontext ? gBrowser.mContextTab : gBrowser.selectedTab);
		if(slowlyCloseTab.isRTL()){
			slowlyCloseTab.removeBefore(ctab);
		}else{
			slowlyCloseTab.removeAfter(ctab);
		}
		slowlyCloseTab.removeAction();
	},

	removeTabCheck : function( tabs ){
		if( tabs.getAttribute( slowlyCloseTab._removeTab ) != '1' ){
			tabs.setAttribute( slowlyCloseTab._removeTab, '1' );
			slowlyCloseTab._removeTabCount++;
		}
		return tabs;
	},
	
	removeBefore : function(ctab) {
		var tabs = slowlyCloseTab.getTabs();
		var i;
		for(i=tabs.length-1; tabs[i] != ctab; i--){}
		for(i--; i>=0; i--){
			if(!tabs[i].pinned){
				slowlyCloseTab.removeTabCheck(tabs[i]);
			}
		}
		// slowlyCloseTab.updateEnabled();
	},
	
	removeAfter : function(ctab) {
		var tabs = slowlyCloseTab.getTabs();
		for(var i=tabs.length-1; tabs[i] != ctab; i--){
			if(!tabs[i].pinned){
				slowlyCloseTab.removeTabCheck(tabs[i]);
			}
		}
		// slowlyCloseTab.updateEnabled();
	},
	
	removeAll : function(usecontext) {
		var tabs = slowlyCloseTab.getTabs();
		for(var i=0; tabs.length > i; i++ ){
			if(!tabs[i].pinned){
				slowlyCloseTab.removeTabCheck(tabs[i]);
			}
		}
		if( tabs.length == 1 ){
			gBrowser.addTab(slowlyCloseTab.getRemoveAllPage());
		}
		slowlyCloseTab.removeAction();
		// slowlyCloseTab.updateEnabled();
	},
	
	getRemoveAllPage : function() {
		var prefSvc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService);
		var prefBranch = prefSvc.getBranch("extensions.slowlyCloseTab.");
	
		switch(prefBranch.getIntPref("removeall_type")) {
		case 0:
			return "about:blank";
		case 1:
			return gHomeButton.getHomePage();
		case 2:
			return prefBranch.getCharPref("removeall_url");
		default:
			return "about:blank";
		}
	},

	getRemoveTime : function(){
		var prefSvc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService);
		var prefBranch = prefSvc.getBranch("extensions.slowlyCloseTab.");
		return prefBranch.getIntPref("remove_time");
	},

	setDisabled : function(id, value) {
		var item = gBrowser.ownerDocument.getElementById(id);
		if(item == null){ return; }
		item.setAttribute("disabled", value);
	},
	
	updateEnabled : function(e) {
		var tabs = slowlyCloseTab.getTabs();
		if(slowlyCloseTab.isRTL()){
			slowlyCloseTab.updateEnabled_rtl(tabs);
		}else{
			slowlyCloseTab.updateEnabled_ltr(tabs);
		}
		var removeallDisabled = tabs.length == gBrowser._numPinnedTabs ||
			(tabs.length <= 1 &&
			 (gBrowser.currentURI.spec == "" || gBrowser.currentURI.spec == "about:blank"));
		slowlyCloseTab.setDisabled("tab-removeallmenu", removeallDisabled);
	},
	
	updateEnabled_ltr : function(tabs) {
		var cpos = (gBrowser.mContextTab ? gBrowser.mContextTab._tPos : 0);
		var spos = gBrowser.selectedTab._tPos;
		var pinned = gBrowser._numPinnedTabs || 0; // "|| 0" for Firefox 3.6
		slowlyCloseTab.setDisabled("tab-removeleftmenu",  (cpos <= pinned));
		slowlyCloseTab.setDisabled("tab-removerightmenu", (cpos < pinned || cpos == tabs.length - 1));
	},
	
	updateEnabled_rtl : function(tabs) {
		var cpos = (gBrowser.mContextTab ? gBrowser.mContextTab._tPos : 0);
		var spos = gBrowser.selectedTab._tPos;
		var pinned = gBrowser._numPinnedTabs || 0; // "|| 0" for Firefox 3.6
		slowlyCloseTab.setDisabled("tab-removeleftmenu",  (cpos < pinned || cpos == tabs.length - 1));
		slowlyCloseTab.setDisabled("tab-removerightmenu", (cpos <= pinned));
	},
	
	addMenuItem : function(browser, menuid) {
		if(!browser){ return; }
		var slowlyCloseTabMenu = browser.ownerDocument.getElementById(menuid).cloneNode(false);
		if(!slowlyCloseTabMenu){ return; }
		slowlyCloseTabMenu.id = "tab-" + menuid;
		var menuParent = slowlyCloseTab.getTabContextMenu(browser);
		var closeOtherTabsEl = document.getElementById("context_closeOtherTabs");
		if(!closeOtherTabsEl){
			menuParent.appendChild(slowlyCloseTabMenu);
		}else{
			menuParent.insertBefore(slowlyCloseTabMenu, closeOtherTabsEl);
		}
	},
	
	addMenuItems : function(browser) {
		var prefSvc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService);
		var prefBranch = prefSvc.getBranch("extensions.slowlyCloseTab.");
	
		if(prefBranch.getBoolPref("add_removeleft_menu")) {
			slowlyCloseTab.addMenuItem(browser, "removeleftmenu");
		}
		if(prefBranch.getBoolPref("add_removeright_menu")) {
			slowlyCloseTab.addMenuItem(browser, "removerightmenu");
		}
		if(prefBranch.getBoolPref("add_removeall_menu")) {
			slowlyCloseTab.addMenuItem(browser, "removeallmenu");
		}
	},
	
	init : function() {
		slowlyCloseTab.addMenuItems(gBrowser);

		var menuParent = slowlyCloseTab.getTabContextMenu(gBrowser);
		menuParent.addEventListener("popupshowing", slowlyCloseTab.updateEnabled, false);

		if( typeof gBrowser.tabContainer !== 'undefined' ){
			var container = gBrowser.tabContainer;
			container.addEventListener("TabClose", slowlyCloseTab.tabRemoveEvent, false);
		}

		slowlyCloseTab.updateEnabled();
	},
	
	getTabs : function() {
		// "visibleTabs" was introduced in Firefox 4.0.
		return gBrowser.visibleTabs || gBrowser.tabContainer.childNodes;
	},

	getTabContextMenu : function(browser) {
		// browser.mStrip is deprecated in Firefox 4.0.
		return browser.tabContextMenu || browser.mStrip.firstChild.nextSibling;
	},

	removeTabRun : function(){
		slowlyCloseTab._removeTabRun = true;
		var i = 0;
		var t = slowlyCloseTab.getRemoveTime();
		var id = setInterval(function(){

				if( slowlyCloseTab._removeTabRunMore ){
					slowlyCloseTab._removeTabRunMore = false;
					i = 0;
				}
				if( slowlyCloseTab._removeTabCount == '0' ){
					slowlyCloseTab._removeTabRun = false;
					var alerts = Components.classes["@mozilla.org/alerts-service;1"].getService(Components.interfaces.nsIAlertsService);
					alerts.showAlertNotification(null, "slowlyCloseTab", "Complete" , false, "", null);
					clearInterval( id );
				}else {
					var tabs = slowlyCloseTab.getTabs();
					var l = tabs.length;
					if( i > l ){ i = 0; }
					while( typeof tabs[i] !== "undefined" ){
						if( tabs[i].getAttribute( slowlyCloseTab._removeTab ) == '1' ){
							gBrowser.removeTab(tabs[i]);
							if( i > 0 ){ i--; }
							break;
						}else { i++; }

					} // End while
				}
		}, t );
	},

	tabRemoveEvent : function(event){
		var tabs = slowlyCloseTab.getTabs();
		var countS = 0;
		slowlyCloseTab._removeTabCount = 0;
		for( var i = 0; tabs.length > i; i++ ){
			var a = tabs[i].getAttribute( slowlyCloseTab._removeTab );
			if( a == '1' ){
				slowlyCloseTab._removeTabCount++;
			}
			if( tabs.length <= 1 ){
				if( a == '1' ){
					countS += 1;
				}
			}
		}
		if( tabs.length == countS ){
			gBrowser.addTab(slowlyCloseTab.getRemoveAllPage());
		}
	}
};

window.addEventListener('load', slowlyCloseTab.init, false);

