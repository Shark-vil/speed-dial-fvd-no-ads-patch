export default new (function () {
	this.ANALYTICS_TID = '';
	this.ANALYTICS_APP = '';
	this.FANCY_SIDE_DIALS_MAX_SCALE = 5;
	this.FANCY_SIDE_DIALS_MIN_SCALE = 1.3;
	this.DISPLAY_AD_EVERY = (Math.floor(Math.random() * 3) + 3) * 24 * 3600 * 1000; // 3 - 5 days
	this.FS_DIALS_PREVIEW_DIR = 'sd_previews';
	this.FS_MOSTVISITED_PREVIEW_DIR = 'mostvisited_previews';
	this.FS_MISC_DIR = 'misc';
	this.AUTOUPDATE_PREVIEW_ENABLED = true;
	this.UNINSTALL_URL = 'https://github.com/Shark-vil/speed-dial-fvd-no-ads-patch';
	this.NEWTAB_URL = 'chrome://newtab/';
	this.MIN_DIALS_SEARCH_QUERY_LENGTH = 2;
	this.IDLE_TIME_FOR_DATABASE_BACKUP = 30;
	this.WIDGETS_DISABLED = true;
	this.DEBUG = true;
	this.MOD_SEARCH_ALIEXPRESS = false;
	this.DIAL_PREVIEW_OVERRIDE = {};
	this.STORE_URL = 'https://github.com/Shark-vil/speed-dial-fvd-no-ads-patch';
	this.HIDE_WIDGETS_PANEL = true;
	this.HIDE_APPS_PANEL = true;
	this.MUTE_WELCOME = true;
	this.FOCUS_NEWTAB_SEARCH = true;
	this.FAVICON_SERVICE = 'https://www.google.com/s2/favicons?domain='; // 'chrome://favicon/'
})();
