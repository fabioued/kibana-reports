
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


  //setting up the index and the mappings during the first loading of the plugin
  setup = () => {
    const { httpClient } = this.props;
    httpClient
      .get(chrome.addBasePath('/api/reporting/setup'))
      .then(res => {
        if (res.data.ok) {
          this.getCsvReports();
        } else {
          if (res.data.resp === 'Authorization Exception') {
            this.setState({
              authorization: true,
            });
            toastNotifications.addDanger(res.data.resp);
          } else {
            toastNotifications.addDanger('An Error Occurred While setting up the plugin');
          }
        }
      })
      .catch(error => {
        toastNotifications.addDanger('An Error Occurred While setting up the plugin');
        throw error;
      });
  };
}
