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

import { DEFAULT_APP_CATEGORIES } from '../../src/core/utils';
import {
  GenerateReportService,
  SetupService,
  DownloadService,
  RecentCsvService,
} from './server/services';
import { setup, generate, reportList, download } from './server/routes';

export default function (kibana) {
  return new kibana.Plugin({
    name: 'reporting',
    require: ['elasticsearch'],
    uiExports: {
      app: {
        title: 'Reporting',
        description: 'Kibana Reports',
        main: 'plugins/reporting/app',
        category: DEFAULT_APP_CATEGORIES.kibana,
      },
    },

    config(Joi) {
      return Joi.object({
        enabled: Joi.boolean().default(true),
        required_backend_role: Joi.string().allow('').default(''),
      }).default();
    },

    init(server, options) {
      const esDriver = server.plugins.elasticsearch;
      const esServer = server.plugins;
      const generateService = new GenerateReportService(esDriver, esServer);
      const setupService = new SetupService(esDriver, esServer);
      const downloadService = new DownloadService(esDriver, esServer);
      const reportsListService = new RecentCsvService(esDriver, esServer);
      const services = { generateService, setupService, downloadService, reportsListService };

      server.injectUiAppVars('reporting', () => {
        const config = server.config();
        return {
          backendRole: config.get('reporting.required_backend_role'),
        };
      });

      // Add server routes
      setup(server, services);
      generate(server, services);
      reportList(server, services);
      download(server, services);
    },
  });
}
