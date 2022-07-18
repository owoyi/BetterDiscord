/**
 * @name AutoAttendance
 * @author 오떱이
 * @authorId 524980170554212363
 * @version 1.3.0
 * @description Sends attendance messages automatically once a day every day. 🇰🇷 Korean language support.
 * @invite MsMrvYXR4A
 * @website https://www.youtube.com/c/오떱이
 * @source https://github.com/owoyi/BetterDiscord/tree/main/Plugins/AutoAttendance
 * @updateUrl https://raw.githubusercontent.com/owoyi/BetterDiscord/main/Plugins/AutoAttendance/AutoAttendance.plugin.js
 */
 

module.exports = (_ => {
	const config = {
		info: {
			name: "AutoAttendance",
			author: "오떱이",
			authors: [{
				name: "오떱이",
				discord_id: "524980170554212363",
				github_username: "owoyi"
			}],
			version: "1.3.0",
				description: "Sends attendance messages automatically once a day every day. 🇰🇷 Korean language support.",
			github: "https://github.com/owoyi/BetterDiscord/tree/main/Plugins/AutoAttendance",
			github_raw: "https://raw.githubusercontent.com/owoyi/BetterDiscord/main/Plugins/AutoAttendance/AutoAttendance.plugin.js"
		}
	};

	return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
		getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
		getDescription () {return `The Library Plugin needed for ${config.info.name} is missing. Open the Plugin Settings to download it. \n\n${config.info.description}`;}
		
		downloadLibrary () {
			require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
				if (!e && b && r.statusCode == 200) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", {type: "success"}));
				else BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
			});
		}
		
		load () {
			if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						this.downloadLibrary();
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
		}
		start () {this.load();}
		stop () {}
		getSettingsPanel () {
			let template = document.createElement("template");
			template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${config.info.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
			template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
			return template.content.firstElementChild;
		}
	} : (([Plugin, BDFDB]) => {
		var aliases = {}, commandSentinel;
		var today = null;
	
		return class AutoAttendance extends Plugin {
			onLoad () {
				this.defaults = {
					
				};
				
				this.patchedModules = {
					before: {
						ChannelTextAreaForm: "render",
						MessageEditor: "render"
					},
					after: {
						Autocomplete: "render"
					}
				};
				
				this.css = `
					${BDFDB.dotCNS.aliasautocomplete + BDFDB.dotCN.autocompleteinner} {
						max-height: 480px;
					}
					${BDFDB.dotCN.autocompleteicon} {
						flex: 0 0 auto;
					}
				`;
			}
			
			onStart () {
				//Cache the function, makes it easier.
				//We can't make these methods cleanly because that would make a `findModule` call.
				this.getGuild = BdApi.findModuleByProps("getGuild", "getGuilds").getGuild;
				this.getChannel = BdApi.findModuleByProps("getChannel", "getDMFromUserId").getChannel;
				this.getMember = BdApi.findModuleByProps("getMember", "getMembers").getMember;
				
				let dataBase = this;
				aliases = BDFDB.DataUtils.load(this, "channels");
				
				this.checking = setInterval(function() {
					//today = new Date().toTimeString().split(" ")[0];
					today = new Date().getDate();
					
					for (let channel_id in aliases) {
						let aliasData = aliases[channel_id];
						let lastSentDate = today;
						
						try { lastSentDate = new Date(aliases[channel_id].lastSentDate).getDate(); }
						catch (error) { lastSentDate = -1; }
						
						if (today != lastSentDate) {
							console.log("[AutoAttendance] Sending " + aliasData.message + " in " + channel_id)
							BdApi.findModuleByProps("sendMessage").sendMessage(channel_id, { content: aliasData.message, tts: false, invalidEmojis: [], validNonShortcutEmojis: []});
							aliases[channel_id].lastSentDate = Date();
							BDFDB.DataUtils.save(aliases, dataBase, "channels");
						}
					}
				}, 1000);
			}
			
			onStop () {
				clearInterval(this.checking)
			}
			
			getSettingsPanel (collapseStates = {}) {
				let settingsPanel;
				return settingsPanel = BDFDB.PluginUtils.createSettingsPanel(this, {
					collapseStates: collapseStates,
					children: _ => {
						let settingsItems = [];
				
						// Add Channel
						let values = {channelValue: "", messageValue: ""};
						let descriptionValue = "";
						let afterSend = true;
						
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: this.labels.add_channel,
							collapseStates: collapseStates,
							children: [
								/*
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
									type: "Button",
									label: this.labels.pick,
									disabled: !Object.keys(values).every(valueName => values[valueName]),
									children: BDFDB.LanguageUtils.LanguageStrings.ADD,
									ref: instance => {if (instance) values.addButton = instance;},
									onClick: _ => {
										this.saveChannels(descriptionValue, values, afterSend);
										BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
									}
								}),
								*/
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex, {
									className: BDFDB.disCN.marginbottom8,
									align: BDFDB.LibraryComponents.Flex.Align.END,
									children: [
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Flex.Child, {
											children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
												title: this.labels.description + ":",
												children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
													value: descriptionValue,
													placeholder: this.labels.unknown_channel,
													maxLength: 20,
													ref: instance => {if (instance) values.descriptionInput = instance;},
													onChange: value => {
														descriptionValue = value;
													}
												})
											})
										}),
										BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.Button, {
											style: {marginBottom: 1},
											disabled: !Object.keys(values).every(valueName => values[valueName]),
											children: BDFDB.LanguageUtils.LanguageStrings.ADD,
											ref: instance => {if (instance) values.addButton = instance;},
											onClick: instance => {
												if (isNaN(values.channelValue)) {
													BdApi.showToast(this.labels.channel_only_number, { type: 'error' });
													instance.target.disabled = true;
													values.channelInstance.props.value = "";
													values.channelInstance.props.errorMessage = this.labels.channel_only_number;
													BDFDB.ReactUtils.forceUpdate(values.channelInstance);
												} else {
													if (this.getChannel(values.channelValue)) {
														this.saveChannels(descriptionValue, values, afterSend);
														BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
													} else {
														BdApi.showToast(this.labels.add_unknown_channel, { type: 'error' });
														instance.target.disabled = true;
														//values.channelInstance.props.value = "";
														values.channelInstance.props.errorMessage = this.labels.add_unknown_channel;
														BDFDB.ReactUtils.forceUpdate(values.channelInstance);
													}
												}
											}
										})
									]
								}),
								this.createInputs(values),
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
									type: "Switch",
									label: this.labels.after_send,
									value: true,
									onChange: value => {
										afterSend = value;
									},
								}),
							].flat(10).filter(n => n)
						}));
						
						// Added Channels
						if (!BDFDB.ObjectUtils.isEmpty(aliases)) settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: this.labels.added_channels,
							collapseStates: collapseStates,
							children: [
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsList, {
									data: Object.keys(aliases).map((channelValue, i) => Object.assign({}, aliases[channelValue], {
										style: {height: "100px"},
										key: channelValue,
										label: channelValue,
										index: i,
										lastSentDate: new Date(aliases[channelValue].lastSentDate).toLocaleString()
									})),
									renderLabel: data => BDFDB.ReactUtils.createElement("div", {
										style: {width: "100%"},
										children: [
											BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormText, {
												style: {marginBottom: 10},
												children: "[" + data.index + "] " + (data.description === undefined || data.description === null || data.description == "" ? (this.getChannel(data.label) == undefined ? this.labels.unknown_channel : "#" + this.getChannel(data.label).name) : data.description) + " (" + this.labels.last_sent_date + ": " + data.lastSentDate + ")"
											}),
											// Channel ID
											BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
												readOnly: true,
												value: data.label,
												placeholder: data.label,
												size: BDFDB.LibraryComponents.TextInput.Sizes.MINI,
												maxLength: 100000000000000000000,
												onChange: value => {
													aliases[value] = aliases[data.label];
													delete aliases[data.label];
													data.label = value;
													BDFDB.DataUtils.save(aliases, this, "channels");
													//BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
												}
											}),
											// Message
											BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
												//readOnly: true,
												value: data.message,
												placeholder: data.message,
												size: BDFDB.LibraryComponents.TextInput.Sizes.MINI,
												maxLength: 100000000000000000000,
												onChange: value => {
													aliases[data.label].message = value;
													BDFDB.DataUtils.save(aliases, this, "channels");
													//BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
												}
											})
										]
									}),
									onRemove: (e, instance) => {
										delete aliases[instance.props.cardId];
										BDFDB.DataUtils.save(aliases, this, "channels");
										BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
									}
								}),
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsItem, {
									type: "Button",
									color: BDFDB.LibraryComponents.Button.Colors.RED,
									label: this.labels.remove_all_channels,
									dividerTop: true,
									onClick: _ => {
										BDFDB.ModalUtils.confirm(this, this.labels.remove_all_channels_ask, _ => {
											aliases = {};
											BDFDB.DataUtils.remove(this, "channels");
											BDFDB.PluginUtils.refreshSettingsPanel(this, settingsPanel, collapseStates);
										});
									},
									children: BDFDB.LanguageUtils.LanguageStrings.REMOVE
								}),
							]
						}));
						
						/*
						settingsItems.push(BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.CollapseContainer, {
							title: "Server Black List",
							collapseStates: collapseStates,
							children: [
								BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.SettingsGuildList, {
									className: BDFDB.disCN.marginbottom20,
									disabled: BDFDB.DataUtils.load(this, "blacklist"),
									onClick: disabledGuilds => {
										this.saveBlacklist(disabledGuilds);
									}
								})
							]
						}));
						*/
						
						return settingsItems;
					}
				});
			}
			
			onSettingsClosed () {
				if (this.SettingsUpdated) {
					delete this.SettingsUpdated;
					BDFDB.PatchUtils.forceAllUpdates(this);
				}
			}
			
			createInputs (values) {
				return [
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
						title: this.labels.channel + ":",
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
							value: values.channelValue,
							placeholder: this.labels.channel_placeholder,
							//type: "number",
							errorMessage: !values.channelValue && this.labels.channel_empty || aliases[values.channelValue] && this.labels.channel_used,
							ref: instance => {if (instance) values.channelInstance = instance;},
							onChange: (value, instance) => {
								values.channelValue = value.trim();
								if (this.getChannel(values.channelValue)) {
									values.descriptionInput.props.placeholder = "#" + this.getChannel(values.channelValue).name;
								} else {
									values.descriptionInput.props.placeholder = "알 수 없는 채널";
								}
								BDFDB.ReactUtils.forceUpdate(values.descriptionInput);
								if (!values.channelValue) instance.props.errorMessage = this.labels.channel_empty;
								else if (aliases[values.channelValue]) instance.props.errorMessage = this.labels.channel_used;
								else delete instance.props.errorMessage;
								values.addButton.props.disabled = !Object.keys(values).every(valueName => values[valueName]);
								BDFDB.ReactUtils.forceUpdate(values.addButton);
							}
						})
					}),
					BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.FormComponents.FormItem, {
						title: this.labels.message + ":",
						className: BDFDB.disCN.marginbottom8,
						children: BDFDB.ReactUtils.createElement(BDFDB.LibraryComponents.TextInput, {
							value: values.messageValue,
							placeholder: this.labels.message_placeholder,
							//autoFocus: true,
							errorMessage: !values.messageValue && this.labels.message_empty,
							onChange: (value, instance) => {
								values.messageValue = value.trim();
								if (!values.messageValue) instance.props.errorMessage = this.labels.message_empty;
								else delete instance.props.errorMessage;
								values.addButton.props.disabled = !Object.keys(values).every(valueName => values[valueName]);
								BDFDB.ReactUtils.forceUpdate(values.addButton);
							}
						})
					})
				];
			}
			
			saveChannels (description, values, afterSend, aliasConfigs = this.settings.configs) {
				var date = null;
				console.log(afterSend);
				if (afterSend != true) {
					date = Date();
				}
				aliases[values.channelValue] = {
					description: description,
					message: values.messageValue,
					lastSentDate: date
				};
				BDFDB.DataUtils.save(aliases, this, "channels");
			}
			
			setLabelsByLanguage () {
				switch (BDFDB.LanguageUtils.getLanguage().id) {
					case "ko":		// Korean
						return {
							pick:												"채널 아이디와 메시지를 입력해 주세요.",
							add_channel:								"채널 추가하기",
							added_channels:							"추가된 채널 목록",
							description:									"설명 (나중에 변경할 수 없습니다.)",
							description_default:						"설명 없음",
							channel:										"* 채널 아이디",
							channel_placeholder:					"ex) 000000000000000000",
							channel_empty:							"채널 아이디를 입력해 주세요.",
							channel_used:								"채널 아이디가 이미 사용되었습니다. 저장하면 이전 값에 덮어씁니다.",
							channel_only_number:					"채널 아이디는 숫자만 입력해 주세요.",
							message:										"* 메시지",
							message_placeholder:					"ex) !출첵",
							message_empty:							"메시지를 입력해 주세요.",
							after_send:									"추가한 뒤 메시지 전송",
							last_sent_date:								"마지막 전송 날짜",
							unknown_channel:						"알 수 없는 채널",
							add_unknown_channel:				"채널을 찾을 수 없습니다. 채널이 존재하는지, 아이디가 유효한지 확인 후 수정해 주세요.",
							remove_all_channels:					"추가된 모든 채널 제거",
							remove_all_channels_ask:				"정말로 추가된 모든 채널을 제거하시겠습니까?",
						};
					default:		// English
						return {
							pick:												"Pick a Channel ID Value and Message Value:",
							add_channel:								"Add Channel",
							added_channels:							"Added Channels",
							description:									"Description (It cannot be changed later.)",
							description_default:						"No description",
							channel:										"* Channel ID",
							channel_placeholder:					"ex) 000000000000000000",
							channel_empty:							"Choose a Channel ID Value",
							channel_used:								"Channel ID Value already used, saving will overwrite old Alias",
							channel_only_number:					"Please enter only numbers for the channel ID.",
							message:										"* Message",
							message_placeholder:					"ex) !attendance",
							message_empty:							"Choose a Message Value",
							after_send:									"Send message after adding",
							last_sent_date:								"Last sent date",
							unknown_channel:						"Unknown channel",
							add_unknown_channel:				"Channel not found. Please edit after checking that the channel exists and that the ID is valid.",
							remove_all_channels:					"Remove all added Channels",
							remove_all_channels_ask:				"Are you sure you want to remove all added Channels?",
						};
				}
			}
			
		};
	})(window.BDFDB_Global.PluginUtils.buildPlugin(config));
})();
