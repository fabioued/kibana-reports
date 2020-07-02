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

generateProxy = () => {
	if (this.state.clickCount >= constants.CLICK_LIMIT) {
		this.setState({ isDisabled: true });
		toastNotifications.addDanger(
			'Click Max Number reached. Please retry in 1 mn '
		);
		return false;
	} else {
		this.setState({ clickCount: this.state.clickCount + 1 });
		this.generateCsv();
	}
	setTimeout(() => {
		this.setState({ isDisabled: false, clickCount: 0 });
	}, 60000);
};

generateCsv = () => {
	const { httpClient } = this.props;
	if (this.state.selectedOptions.length === 0) {
		toastNotifications.addDanger('Please select a saved search !');
		throw new Error('Please select a saved search !');
	}
	const savedSearchId = this.state.selectedOptions[0].id;
	const start = this.state.start;
	const end = this.state.end;
	const startMoment = dateMath.parse(start);
	if (!startMoment || !startMoment.isValid()) {
		toastNotifications.addDanger('Unable to get the start Date');
		throw new Error('Unable to parse start string');
	}
	const endMoment = dateMath.parse(end);
	if (!endMoment || !endMoment.isValid()) {
		toastNotifications.addDanger('Unable to get the end Date');
		throw new Error('Unable to parse end string');
	}

	if (startMoment > endMoment) {
		this.setState({
			isDisabled: true,
		});
		toastNotifications.addDanger('Wrong Date Selection');
		throw new Error('Unable to parse end string');
	}
	const restapiinfo = JSON.parse(sessionStorage.getItem('restapiinfo'));
	let username = 'Guest';
	if (restapiinfo) {
		username = restapiinfo.user_name;
	}
	const url =
		'../api/reporting/csv/generateReport/' +
		savedSearchId +
		'/' +
		startMoment +
		'/' +
		endMoment +
		'/' +
		username;
	httpClient.get(url);
	setTimeout(() => {
		this.getRecentCsv();
	}, 1000);
};
