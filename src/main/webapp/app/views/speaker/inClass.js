/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 app/speaker/inClass.js
 - Beschreibung: Startseite für Session-Inhaber.
 - Version:      1.0, 01/05/12
 - Autor(en):    Christian Thomas Weber <christian.t.weber@gmail.com>
 +---------------------------------------------------------------------------+
 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or any later version.
 +---------------------------------------------------------------------------+
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 +--------------------------------------------------------------------------*/
ARSnova.views.speaker.InClass = Ext.extend(Ext.Panel, {
	title	: Messages.FEEDBACK,
	iconCls	: 'feedbackMedium',
	scroll  : 'vertical',
	
	inClassItems			: null,
	audienceQuestionButton	: null,
	questionsFromUserButton	: null,
	flashcardButton			: null,
	quizButton			 	: null,
		
	inClassActions: null,
	sessionStatusButton			: null,
	createAdHocQuestionButton	: null,
		
	/**
	 * count every x seconds all actually logged-in users for this sessions
	 */
	countActiveUsersTask: {
		name: 'count the actually logged in users',
		run: function(){
			ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.countActiveUsers();
		},
		interval: 15000
	},
	
	/**
	 * task for speakers in a session
	 * count every x seconds the number of feedback questions
	 */
	countFeedbackQuestionsTask: {
		name: 'count feedback questions',
		run: function(){
			ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.countFeedbackQuestions();
		},
		interval: 15000
	},
	
	constructor: function(){
		var loggedInCls = '';
		if (ARSnova.loginMode == ARSnova.LOGIN_THM) {
			loggedInCls = 'thm';
		}
		
		this.sessionLogoutButton = new Ext.Button({
			text	: Messages.SESSIONS,
			ui		: 'back',
			cls		: loggedInCls,
			handler	: function() {
				Ext.dispatch({
					controller	: 'sessions',
					action		: 'logout'
				});
			}
		});
		
		this.toolbar = new Ext.Toolbar({
			title: localStorage.getItem("shortName"),
			items: [
		        this.sessionLogoutButton
			]
		});
		
		this.dockedItems = [this.toolbar];
		
		this.audienceQuestionButton = new Ext.Button({
			ui				: 'normal',
			text			: Messages.QUESTIONS_TO_STUDENTS,
			cls				: 'forwardListButton',
			badgeCls		: 'badgeicon',
			doubleBadgeCls	: 'doublebadgeicon',
			controller		: 'questions',
			action			: 'listAudienceQuestions',
			handler			: this.buttonClicked
		});
		
		this.feedbackQuestionButton = new Ext.Button({
			ui			: 'normal',
			text		: Messages.QUESTIONS_FROM_STUDENTS,
			cls			: 'forwardListButton',
			badgeCls	: 'bluebadgeicon',
			controller	: 'questions',
			action		: 'listFeedbackQuestions',
			handler		: this.buttonClicked
		});
		
		this.flashcardButton = new Ext.Button({
			ui			: 'normal',
			text		: Messages.FLASHCARDS,
			listeners: {
				click: {
					element: 'el',
					fn: function (e) {
						window.open("http://www.cobocards.com/");
					}
				}
			}
		});
		
		this.inClassItems = {
				xtype: 'form',
				cls	 : 'standardForm topPadding',
				
				items: [{
					cls: 'gravure',
					html: localStorage.getItem("name")
				}, {
					xtype: 'fieldset',
					cls	 : 'standardFieldset noMargin',
					instructions: "Session-ID: " + ARSnova.formatSessionID(localStorage.getItem("keyword")),
					items: [
						this.audienceQuestionButton,
						this.feedbackQuestionButton,
						this.flashcardButton
					]
				}]
		};
		
		this.createAdHocQuestionButton = new Ext.Panel({
			cls: 'threeButtons left',
			
			items: [{
				xtype		: 'button',
				text		: ' ',
				cls			: 'questionMark',
				controller	: 'questions',
				action		: 'adHoc',
				handler		: this.buttonClicked
			}, {
				html: Messages.AH_HOC_QUESTION,
				cls	: 'centerTextSmall'
			}]
		});
		
		this.sessionStatusButton = new ARSnova.views.SessionStatusButton();
		
		this.deleteSessionButton = new Ext.Panel({
			cls: 'threeButtons left',
			
			items: [{
				xtype	: 'button',
				text	: ' ',
				cls		: 'deleteIcon',
				scope	: this,
				handler	: function(){
					var msg = Messages.ARE_YOU_SURE +
							"<br>" + Messages.DELETE_SESSION_NOTICE;
					Ext.Msg.confirm(Messages.DELETE_SESSION, msg, function(answer){
						if (answer == 'yes') {
							ARSnova.showLoadMask(Messages.LOAD_MASK_SESSION_DELETE);
							ARSnova.sessionModel.destroy(localStorage.getItem('sessionId'), localStorage.getItem('login'), {
								success: function(){
									ARSnova.removeVisitedSession(localStorage.getItem('sessionId'));
									ARSnova.mainTabPanel.tabPanel.on('cardswitch', function(){
										ARSnova.mainTabPanel.tabPanel.homeTabPanel.mySessionsPanel.loadCreatedSessions();
										setTimeout("ARSnova.hideLoadMask()", 1000);
									}, this, {single:true});
									Ext.dispatch({
										controller	: 'sessions',
										action		: 'logout'
									});
								},
								failure: function(response){
									console.log('server-side error delete session');
								}
							});
						}
					});
					Ext.Msg.doComponentLayout();
				}
			}, {
				html: Messages.DELETE_SESSION,
				cls	: 'centerTextSmall'
			}]
		});
		
		this.inClassActions = new Ext.form.FormPanel({
			cls	 : 'actionsForm',
				
			items: [
			    this.createAdHocQuestionButton,
			    this.sessionStatusButton,
			    this.deleteSessionButton
	        ]
				        
		});
		
		this.items = [this.inClassItems, this.inClassActions];
		
		ARSnova.views.speaker.InClass.superclass.constructor.call(this);
	},
	
	initComponent: function(){
		this.on('destroy', this.destroyListeners);
		
		this.on('activate', function(){
			this.updateBadges();
		});
		
		ARSnova.views.speaker.InClass.superclass.initComponent.call(this);
	},
	
	buttonClicked: function(button){
		Ext.dispatch({
			controller	: button.controller,
			action		: button.action
		});
	},
	
	/* will be called on session login */
	registerListeners: function(){
		var inClassPanel = ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
		taskManager.start(inClassPanel.countActiveUsersTask);
		taskManager.start(inClassPanel.countFeedbackQuestionsTask);
	},

	/* will be called on session logout */
	destroyListeners: function(){
		var inClassPanel = ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
		taskManager.stop(inClassPanel.countActiveUsersTask);
		taskManager.stop(inClassPanel.countFeedbackQuestionsTask);
	},
	
	updateBadges: function(){
		var panel = ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
		panel.updateAudienceQuestionBadge();
	},
	
	updateAudienceQuestionBadge: function() {
		var parseValue = function(responseObj) {
			var value = "";
			if (responseObj.length > 0){
				value = responseObj[0].value;
			}
			return value;
		};
		var failureCallback = function() {
			console.log('server-side error');
		};
		
		ARSnova.questionModel.countSkillQuestions(localStorage.getItem("sessionId"), {
			success: function(response) {
				var numQuestions = parseValue(Ext.decode(response.responseText).rows);
				ARSnova.questionModel.countTotalAnswers(localStorage.getItem("sessionId"), {
					success: function(response) {
						var numAnswers = parseValue(Ext.decode(response.responseText).rows);
						
						var panel = ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel;
						var audienceQuestionButton = panel.audienceQuestionButton;
						
						audienceQuestionButton.setBadge(numQuestions);
						var setAdditionalBadge = function() {
							if (!audienceQuestionButton.doubleBadge && numAnswers) {
								audienceQuestionButton.doubleBadge = audienceQuestionButton.el.createChild({
									tag: 'span',
									cls: audienceQuestionButton.doubleBadgeCls,
									html: numAnswers
								});
								audienceQuestionButton.badgeEl.addCls("withdoublebadge");
							} else if (audienceQuestionButton.doubleBadge) {
								if (numAnswers) {
									audienceQuestionButton.doubleBadge.setHTML(numAnswers);
								} else {
									audienceQuestionButton.doubleBadge.remove();
									audienceQuestionButton.doubleBadge = null;
									audienceQuestionButton.badgeEl.removeCls("withdoublebadge");
								}
							}
						};
						if (!audienceQuestionButton.rendered) {
							audienceQuestionButton.on('afterrender', setAdditionalBadge);
						} else {
							setAdditionalBadge();
						}
					},
					failure: failureCallback
				});
			}, 
			failure: failureCallback
		});
	},
	
	countActiveUsers: function(){
		ARSnova.loggedInModel.countActiveUsersBySession(localStorage.getItem("keyword"), {
			success: function(response){
				var value = parseInt(response.responseText);
				if (value > 0) {
					// Do not count myself ;-)
					value--;
				}
				
				ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.toolbar.setTitle(localStorage.getItem("shortName") + " (" + value + ")");
				
				//update feedback counter
				var counterEl = ARSnova.mainTabPanel.tabPanel.feedbackTabPanel.statisticPanel.feedbackCounter;
				var title = counterEl.getText().split("/");
				title[1] = value;
				title = title.join("/");
				counterEl.update(title);
			},
			failure: function(){
				console.log('server-side error');
			}
		});
	},
	
	countFeedbackQuestions: function(){
		ARSnova.questionModel.countFeedbackQuestions(localStorage.getItem("sessionId"), {
			success: function(response){
				var responseObj = Ext.decode(response.responseText).rows;
				var questions = 0;
				
				if (responseObj.length > 0){
					for (var i = 0; i < responseObj.length; i++){
						var obj = responseObj[i];
						
						if (obj.key[1] == "unread") {
							ARSnova.mainTabPanel.tabPanel.feedbackQuestionsPanel.tab.setBadge(obj.value);
						}
						
						questions += obj.value;
					}
				}
				
				ARSnova.mainTabPanel.tabPanel.speakerTabPanel.inClassPanel.feedbackQuestionButton.setBadge(questions);
			}, 
			failure: function(){
				console.log('server-side error');
			}
		});
	}
});