/*
 * Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

//get the user roles and the required role setup in the kibana.yml file to let specific users get access to the plugin.

const restapiinfo = JSON.parse(sessionStorage.getItem('restapiinfo'));

const backendroles = restapiinfo.user;

//reportingService  is coming from the vars inside ../services/vars.js
const requiredBackend = this.props.reportingService.get();
if (requiredBackend) {
	if (!backendroles.includes(requiredBackend)) {
		this.setState({
			authorization: true,
		});
	}
}

//get the current logged in user from the local storage.
//if the the security plugin of ODFE is not installed set the user to guest otherwise get the username.
let username = 'Guest';
if (restapiinfo) {
	username = restapiinfo.user_name;
}

//get the last selected date on the discover tab and set the datepicker to it
const lastSubUrl = JSON.parse(
	localStorage.getItem('kibana.timepicker.timeHistory')
);

if (lastSubUrl) {
	this.setState({
		start: lastSubUrl[0].from,
		end: lastSubUrl[0].to,
	});
}
