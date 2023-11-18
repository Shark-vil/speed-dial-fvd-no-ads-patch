export const userStorageKey = 'sync.user-info';
const userConfigStorageKey = 'sync.user-config';
export const userStorageConfigs = {
	enableSearch: `${userConfigStorageKey}__search-enable`,
};

class UserInfoSync {
	fvdSpeedDial = null;
	userInfo = null;
	isSearchEnable = true;
	fvdSynchronizerName = 'EverSync';
	fvdSynchronizerIds = [
		// Chrome Webstore EverSync ID
		'iohcojnlgnfbmjfjfkbhahhmppcggdog',
		// Opera addons EverSync ID
		'ffhogmjbkahkkpjpjmeppoegnjhpopmc',
	];

	constructor(fvdSpeedDial) {
		this.init(fvdSpeedDial);
	}

	init(fvdSpeedDial) {
		this.fvdSpeedDial = fvdSpeedDial;
		const { localStorage, Prefs } = fvdSpeedDial;

		const that = this;

		chrome.management.getAll(function (results) {
			results.forEach(function (extension) {
				if (
					extension.enabled
					&& (extension.name.includes(that.fvdSynchronizerName) || that.fvdSynchronizerIds.indexOf(extension.id) >= 0)
				) {
					// userInfo init from storage
					const storageUserInfo = localStorage.getItem(userStorageKey);
					that.setUserInfo(storageUserInfo || null);

					// userConfig init from storage
					if (storageUserInfo && storageUserInfo?.user?.premium?.active && storageUserInfo?.state === 'logged-in') {
						let storageEnableSearchValues = localStorage.getItem(userStorageConfigs.enableSearch);

						if (typeof storageEnableSearchValues === 'boolean') {
							storageEnableSearchValues = {};
						}

						const defaultSearchEnableValue = Prefs.get('sd.enable_search');

						if (storageEnableSearchValues && storageEnableSearchValues.hasOwnProperty(storageUserInfo?.user?.user_id)) {
							that.isSearchEnable = storageEnableSearchValues[storageUserInfo?.user?.user_id];
						} else {
							that.isSearchEnable = defaultSearchEnableValue;
							localStorage.setItem(userStorageConfigs.enableSearch, { [storageUserInfo?.user?.user_id]: defaultSearchEnableValue });
						}
					}
				}
			});
		});
	}

	getUserInfo() {
		return this.userInfo;
	}

	getIsUserActive() {
		return !!this.userInfo && this.userInfo.state === 'logged-in';
	}

	getIsPremiumUser() {
		if (!this.userInfo) {
			return false;
		}

		return this.getIsUserActive() && this.userInfo.user?.premium?.active;
	}

	getIsSearchEnable() {
		if (!this.getIsUserActive()) {
			return true;
		}

		return this.getIsPremiumUser() ? this.isSearchEnable : true;
	}

	setUserInfo(info) {
		if (!info || !info?.auth) {
			this.userInfo = null;
			this.fvdSpeedDial.localStorage.setItem(userStorageKey, null);
			return;
		}

		const newUserInfo = {
			...info,
			state: info.state || 'logged-in',
		};

		this.userInfo = newUserInfo;
		this.fvdSpeedDial.localStorage.setItem(userStorageKey, newUserInfo);
	}

	setIsSearchEnable(isSearchEnable) {
		this.isSearchEnable = isSearchEnable;
		const storageValues = this.fvdSpeedDial.localStorage.getItem(userStorageConfigs.enableSearch);

		if (typeof storageValues === 'object') {
			storageValues[this.userInfo.user.user_id] = isSearchEnable;
			this.fvdSpeedDial.localStorage.setItem(userStorageConfigs.enableSearch, storageValues);
		} else {
			this.fvdSpeedDial.localStorage.setItem(userStorageConfigs.enableSearch, { [this.userInfo.user.user_id]: isSearchEnable });
		}

	}

	triggerOnLogin(userInfo) {
		if (!userInfo) {
			return;
		}

		this.setUserInfo(userInfo);
		const storageEnableSearchValues = this.fvdSpeedDial.localStorage.getItem(userStorageConfigs.enableSearch);

		if (storageEnableSearchValues 
			&& storageEnableSearchValues.hasOwnProperty(userInfo?.user?.user_id)
			&& userInfo?.user?.premium?.active) {
			this.isSearchEnable = storageEnableSearchValues[userInfo?.user?.user_id];
		} else {
			this.isSearchEnable = true;
			storageEnableSearchValues[userInfo?.user?.user_id] = true;
			this.fvdSpeedDial.localStorage.setItem(userStorageConfigs.enableSearch, storageEnableSearchValues);
		}

		chrome.runtime.sendMessage({
			action: 'user:login',
		});
	}

	triggerOnLogout() {
		this.isSearchEnable = true;

		this.fvdSpeedDial.localStorage.removeItem(userStorageKey);
		this.userInfo = null;

		chrome.runtime.sendMessage({
			action: 'user:logout',
		});
	}
}

export default UserInfoSync;