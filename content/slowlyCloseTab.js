

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

	removeTabCheck : function( tabs ){
		if(tabs.pinned || tabs.getAttribute( 'protected' ) ){
			return tabs;
		}
		if( tabs.getAttribute( slowlyCloseTab._removeTab ) != '1' ){
			tabs.setAttribute( slowlyCloseTab._removeTab, '1' );
			slowlyCloseTab._removeTabCount++;
		}
		return tabs;
	},

	removeLeft : function(usecontext) {
		var ctab = slowlyCloseTab.getCtabs(usecontext);
		if(slowlyCloseTab.isRTL()){
			slowlyCloseTab.removeAfter(ctab);
		}else{
			slowlyCloseTab.removeBefore(ctab);
		}
		slowlyCloseTab.removeAction();
	},
	
	removeRight : function(usecontext) {
		var ctab = slowlyCloseTab.getCtabs(usecontext);
		if(slowlyCloseTab.isRTL()){
			slowlyCloseTab.removeBefore(ctab);
		}else{
			slowlyCloseTab.removeAfter(ctab);
		}
		slowlyCloseTab.removeAction();
	},
	
	removeBefore : function(ctab) {
		var tabs = slowlyCloseTab.getTabs();
		for( var i = 0, len = tabs.length; tabs[i] != ctab; i++){
			slowlyCloseTab.removeTabCheck(tabs[i]);
		}
	},
	
	removeAfter : function(ctab) {
		var tabs = slowlyCloseTab.getTabs();
		for(var i=tabs.length-1; tabs[i] != ctab; i--){
			slowlyCloseTab.removeTabCheck(tabs[i]);
		}
	},

	removeOther : function(usecontext){
		var tabs = slowlyCloseTab.getTabs();
		var ctab = slowlyCloseTab.getCtabs(usecontext);
		for( var i = 0, len = tabs.length; len > i; i++ ){
			if( ctab != tabs[i] ){
				slowlyCloseTab.removeTabCheck(tabs[i]);
			}
		}
		slowlyCloseTab.removeAction();
	},

	removeAll : function() {
		var tabs = slowlyCloseTab.getTabs();
		for(var i=0,len = tabs.length; len > i; i++ ){
			slowlyCloseTab.removeTabCheck(tabs[i]);
		}
		slowlyCloseTab.removeAction();
	},

	getExtensionsData : function(){
		var cc = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefService);
		return cc.getBranch("extensions.slowlyCloseTab.");
	},

	getRemoveAllPage : function() {
		var prefBranch = slowlyCloseTab.getExtensionsData();
	
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
		var prefBranch = slowlyCloseTab.getExtensionsData();
		return prefBranch.getIntPref("remove_time");
	},

	setDisabled : function(id, value) {
		var item = gBrowser.ownerDocument.getElementById(id);
		if(item == null){ return; }
		item.setAttribute("disabled", value);
	},

	getmContextTab : function(tabs){
		var a = slowlyCloseTab.getCtabs(true);
		for( var i = 0, len = tabs.length; len > i; i++ ){
			if( a == tabs[i] ){
				return i;
				break;
			}
		}
		return false;
	},

	updateEnabled : function(e) {
		var tabs = slowlyCloseTab.getTabs();
		var c = slowlyCloseTab.getmContextTab(tabs);
		if(slowlyCloseTab.isRTL()){
			slowlyCloseTab.updateEnabled_rtl(tabs,c);
		}else{
			slowlyCloseTab.updateEnabled_ltr(tabs,c);
		}
		var removeallDisabled = tabs.length == gBrowser._numPinnedTabs ||
			(tabs.length <= 1 &&
			 (gBrowser.currentURI.spec == "" || gBrowser.currentURI.spec == "about:blank"));
		slowlyCloseTab.setDisabled("tab-removeallmenu", removeallDisabled);
	},

	updateEnabled_ltr : function(tabs,c) {
		var pinned = gBrowser._numPinnedTabs || 0; // "|| 0" for Firefox 3.6
		slowlyCloseTab.setDisabled("tab-removeleftmenu",  (c <= pinned));
		slowlyCloseTab.setDisabled("tab-removerightmenu", (c < pinned || c == tabs.length - 1));
		slowlyCloseTab.setDisabled("tab-removeothermenu", ( gBrowser.mContextTab.pinned || tabs.length - pinned <= 1 ) );
	},

	updateEnabled_rtl : function(tabs,c) {
		var pinned = gBrowser._numPinnedTabs || 0; // "|| 0" for Firefox 3.6
		slowlyCloseTab.setDisabled("tab-removeleftmenu",  (c < pinned || c == tabs.length - 1));
		slowlyCloseTab.setDisabled("tab-removerightmenu", (c <= pinned));
		slowlyCloseTab.setDisabled("tab-removeothermenu", ( gBrowser.mContextTab.pinned || tabs.length - pinned <= 1 ) );
	},

	addMenuItem : function(browser, menuid, type) {
		if(!browser){ return; }

		var item = browser.ownerDocument.getElementById( menuid );
		if(!item){ return; }
		item.hidden = type;
	},
	
	addMenuItems : function(browser) {
		var prefBranch = slowlyCloseTab.getExtensionsData();
	
		slowlyCloseTab.addMenuItem(browser, "tab-removeleftmenu", !prefBranch.getBoolPref("add_removeleft_menu"));
		slowlyCloseTab.addMenuItem(browser, "tab-removerightmenu", !prefBranch.getBoolPref("add_removeright_menu"));
		slowlyCloseTab.addMenuItem(browser, "tab-removeothermenu", !prefBranch.getBoolPref("add_removeother_menu"));
		slowlyCloseTab.addMenuItem(browser, "tab-removeallmenu", !prefBranch.getBoolPref("add_removeall_menu"));
	},
	
	init : function() {
		slowlyCloseTab.addMenuItems(gBrowser);

		var menuParent = slowlyCloseTab.getTabContextMenu(gBrowser);
		menuParent.addEventListener("popupshowing", slowlyCloseTab.updateEnabled, false);

		gBrowser.tabContainer.addEventListener("TabClose", slowlyCloseTab.tabRemoveEvent, false);
	},

	getTabs : function() {
		// "visibleTabs" was introduced in Firefox 4.0.
		return gBrowser.visibleTabs || gBrowser.tabContainer.childNodes;
	},

	getCtabs : function(usecontext){
		return (usecontext ? gBrowser.mContextTab : gBrowser.selectedTab);
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
		for( var i = 0, len = tabs.length; len > i; i++ ){
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
	},

	d : function(){
		var menuParent = slowlyCloseTab.getTabContextMenu(gBrowser);
		menuParent.removeEventListener("popupshowing", slowlyCloseTab.updateEnabled, false);

		gBrowser.tabContainer.removeEventListener("TabClose", slowlyCloseTab.tabRemoveEvent, false);
		slowlyCloseTab = void 0;
	}
};

window.addEventListener('load', function(){ slowlyCloseTab.init(); }, false);
window.addEventListener('unload', function(){ slowlyCloseTab.d(); }, false);

