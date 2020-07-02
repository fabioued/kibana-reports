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

//get the list of saved searches.
getSavedSearch = () => {
	const url = chrome.addBasePath(
		'/api/kibana/management/saved_objects/_find?perPage=10000&page=1&fields=id&type=search'
	);
	const { httpClient } = this.props;
	httpClient
		.get(url)
		.then((res) => {
			const data = res.data.saved_objects;
			data.map((data) => {
				this.state.options.push({ label: data.meta.title, id: data.id });
			});
			this.setState({ savedObjects: data });
		})
		.then((error) => {
			if (error) {
				this.setState({ options: [] });
				toastNotifications.addDanger(
					'An Error Occurred While fetching the Saved Search'
				);
				throw new Error('An Error Occurred While fetching the Saved Search');
			}
		});
};
