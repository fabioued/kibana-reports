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

const moment = require('moment');
const constants = require('../utils/constants');
const INDEX_NAME = constants.INDEX_NAME;
const CSV_BY_USERS = constants.CSV_BY_USERS;

export default class RecentCsvService {
	constructor(esDriver, esServer) {
		this.esDriver = esDriver;
		this.esServer = esServer;
	}

	// getting the advanced settings of kibana to retrieve the date format
	getAdvancedSettings = async (_req) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			return await callWithRequest(_req, 'search', {
				index: '.kibana',
				body: {
					query: {
						term: {
							type: {
								value: 'config',
							},
						},
					},
				},
			});
		} catch (err) {
			return { ok: false, resp: err.message };
		}
	};

	getReports = async (_req) => {
		try {
			const csvReports = [];
			const { callWithRequest } = this.esDriver.getCluster('data');
			const reportsDocs = await callWithRequest(_req, 'search', {
				index: INDEX_NAME,
				body: {
					size: CSV_BY_USERS,
					sort: [{ date: { order: 'desc' } }],
					query: {
						bool: {
							filter: {
								match: {
									fileType: 'csv',
								},
							},
						},
					},
				},
			});

			const advancedSettings = await this.getAdvancedSettings(_req);
			const dateFormat =
				advancedSettings.hits.hits[0]._source.config.dateFormat;
			let format = '';
			if (dateFormat) format = dateFormat;
			else format = 'MMM D, YYYY @ HH:mm:ss.SSS';
			// Formating the data according to the table columns in the frontEnd.
			for (const report of reportsDocs.hits.hits) {
				csvReports.push({
					id: report._id,
					saveSearch: report._source.file,
					status: report._source.status,
					message: report._source.message,
					date: moment(report._source.date, 'DD-MM-YYYY HH:mm:ss').format(
						format.toString()
					),
					download: report._source.downloadLink,
					userId: report._source.userId,
					username: report._source.username,
				});
			}
			return { ok: true, resp: csvReports };
		} catch (err) {
			return { ok: false, resp: err.message };
		}
	};

	getCsvReportsList = async (_req) => {
		try {
			const csvReportsList = await this.getReports(_req);
			return csvReportsList;
		} catch (err) {
			return { ok: false, resp: err.message };
		}
	};
}
