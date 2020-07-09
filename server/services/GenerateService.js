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

const esb = require('elastic-builder');
const moment = require('moment');
const converter = require('json-2-csv');
const csv = require('csv');
const constants = require('../utils/constants');

const INDEX_NAME = constants.INDEX_NAME;
const CSV_BY_USERS = constants.CSV_BY_USERS;
const EMPTY_FIELD_VALUE = constants.EMPTY_FIELD_VALUE;
const EXCEL_FORMAT = constants.EXCEL_FORMAT;
const MAX_ROWS = constants.MAX_ROWS;

const winston = require('winston');
const logger = winston.createLogger({
	transports: [new winston.transports.Console()],
});

export default class CsvGeneratorService {
	constructor(esDriver, esServer) {
		this.esDriver = esDriver;
		this.esServer = esServer;
	}

	//get the advanced settings from Kibana
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
			logger.error('Reporting - GenerateService - getAdvancedSettings:', err);
			return { ok: false, resp: err.message };
		}
	};

	//saving a report to the index
	saveReport = async (_req, file, status, binary, message, username, type) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const date = moment().format('DD-MM-YYYY HH:mm:ss');
			const params = {
				index: INDEX_NAME,
				body: {
					fileType: type,
					file: file,
					downloadLink: '',
					date: date,
					status: status,
					binary: binary,
					message: message,
					username: username,
				},
			};
			const document = await callWithRequest(_req, 'index', params);
			return document;
		} catch (err) {
			logger.error('Reporting - GenerateService - saveReport:', err);
			return { ok: false, resp: err.message };
		}
	};

	//updating the report
	updateCSV = async (
		_req,
		documentId,
		status,
		binary,
		message,
		username,
		file
	) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const date = moment().format('DD-MM-YYYY HH:mm:ss');
			const params = {
				index: INDEX_NAME,
				id: documentId,
				body: {
					fileType: 'csv',
					file: file,
					downloadLink: '',
					date: date,
					status: status,
					binary: binary,
					message: message,
					username: username,
				},
			};
			const document = await callWithRequest(_req, 'index', params);
			return { ok: true, resp: document };
		} catch (err) {
			logger.error('Reporting - GenerateService - updateCSV:', err);
			return { ok: false, resp: err.message };
		}
	};

	//fetch the saved search infos.
	getSavedSearchInfo = async (_req, savedsearchId) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const savedsearchIdFromES = await callWithRequest(_req, 'get', {
				index: '.kibana',
				id: 'search:' + savedsearchId,
			});
			return savedsearchIdFromES;
		} catch (err) {
			logger.error('Reporting - GenerateService - getSavedSearchInfo:', err);
			return { ok: false, resp: err.message };
		}
	};

	// retrieving the index pattern of the saved  search
	getIndexPattern = async (_req, indexpatternId) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const indexpatern = await callWithRequest(_req, 'get', {
				index: '.kibana',
				id: 'index-pattern:' + indexpatternId,
			});
			return indexpatern;
		} catch (err) {
			logger.error('Reporting - GenerateService - getIndexPattern:', err);
			return { ok: false, resp: err.message };
		}
	};

	// fetching the count of data in ES
	esFetchCount = async (_req, indexPatternTitle, bodyCount) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const fecthCountRes = callWithRequest(_req, 'count', {
				index: indexPatternTitle,
				body: bodyCount,
			});
			return fecthCountRes;
		} catch (err) {
			logger.error('Reporting - GenerateService - esFetchCount:', err);
			return { ok: false, resp: err.message };
		}
	};

	// fetching the data in ES
	esFetchData = async (_req, indexPatternTitle, body, list_columns_date) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const docvalues = [];
			logger.info('list_columns_date is ', list_columns_date);
			for (const dateType of list_columns_date) {
				docvalues.push({
					field: dateType,
					format: 'date_hour_minute',
				});
			}
			console.log('body is ', JSON.stringify(body));
			const newBody = {
				query: body.query,
				docvalue_fields: docvalues,
			};
			const fecthDataRes = callWithRequest(_req, 'search', {
				index: indexPatternTitle,
				scroll: '1m',
				body: newBody,
				size: 10000,
			});
			return fecthDataRes;
		} catch (err) {
			logger.error('Reporting - GenerateService - esFetchData:', err);
			return { ok: false, resp: err.message };
		}
	};

	// fetching the count of data in ES using the scroll
	esFetchScroll = async (_req, scrollId) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const fecthDataScrollRes = callWithRequest(_req, 'scroll', {
				scrollId: scrollId,
				scroll: '1m',
			});
			return fecthDataScrollRes;
		} catch (err) {
			logger.error('Reporting - GenerateService - esFetchScroll:', err);
			return { ok: false, resp: err.message };
		}
	};

	//count the number of generated Reports By User
	countUserReports = async (_req, username) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const csvCountByuser = callWithRequest(_req, 'count', {
				index: INDEX_NAME,
				q: 'username:' + username,
			});
			return csvCountByuser;
		} catch (err) {
			logger.error('Reporting - GenerateService - countUserReports:', err);
			return { ok: false, resp: err.message };
		}
	};

	//get the oldest report
	getOldestReport = async (_req, username) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			const docs = await callWithRequest(_req, 'search', {
				index: INDEX_NAME,
				body: {
					size: 1,
					sort: [{ date: { order: 'asc' } }],
					query: {
						term: { username: username },
					},
				},
			});
			return docs;
		} catch (err) {
			logger.error('Reporting - GenerateService - getOldestReport:', err);
			return { ok: false, resp: err.message };
		}
	};

	//delete a report
	deleteReport = async (_req, doc_id) => {
		try {
			const { callWithRequest } = this.esDriver.getCluster('data');
			return callWithRequest(_req, 'delete', {
				index: INDEX_NAME,
				id: doc_id,
			});
		} catch (err) {
			logger.error('Reporting - GenerateService - deleteReport:', err);
			return { ok: false, resp: err.message };
		}
	};

	traverse = (data, keys, result = {}) => {
		for (let k of Object.keys(data)) {
			if (keys.includes(k)) {
				result = Object.assign({}, result, {
					[k]: data[k],
				});
				// result = {
				//   ...result,
				//   ...{
				//     [k]: data[k],
				//   },
				// };
				continue;
			}
			if (
				data[k] &&
				typeof data[k] === 'object' &&
				Object.keys(data[k]).length > 0
			) {
				result = this.traverse(data[k], keys, result);
			}
		}
		return result;
	};

	genereteReport = async (_req, documentId, username, strFilename) => {
		const time_range_gte = _req.params.start;
		const time_range_lte = _req.params.end;
		const savedsearchId = _req.params.savedsearchId;
		const strColumns = [];
		const header_search = [];
		let fields_exist = false;
		let savedSearchInfos = {};
		let indexPatter = '';
		let resIndexPattern = '';
		let fieldsPattern = '';
		let header = [];
		const dataset = [];
		const format = [];
		const delimiter = [];
		const nullBinary = 'bnVsbA==';

		const advancedSettings = await this.getAdvancedSettings(_req);
		const csvSeparator =
			advancedSettings.hits.hits[0]._source.config['csv:separator'];
		const dateFormat = advancedSettings.hits.hits[0]._source.config.dateFormat;

		if (dateFormat) format.push(dateFormat);
		else format.push('MMM D, YYYY @ HH:mm:ss.SSS');

		savedSearchInfos = await this.getSavedSearchInfo(_req, savedsearchId);
		const filters =
			savedSearchInfos._source.search.kibanaSavedObjectMeta.searchSourceJSON;
		//get the list of selected columns in the saved search.Otherwise select all the fields under the _source
		for (const column of savedSearchInfos._source.search.columns) {
			if (column !== '_source') {
				fields_exist = true;
				const split = column.split('.');
				if (split.length >= 2) {
					header_search.push(split[1]);
				} else {
					header_search.push(column);
				}
				strColumns.push(column);
			} else {
				strColumns.push('_source');
			}
		}

		//Get index name
		for (const item of savedSearchInfos._source.references) {
			if (item.name === JSON.parse(filters).indexRefName) {
				//Get index-pattern informations (index-pattern name & timeFieldName)
				indexPatter = await this.getIndexPattern(_req, item.id);
				resIndexPattern = indexPatter._source['index-pattern'];
				fieldsPattern = resIndexPattern.fields; //Get fields type

				//Get fields Date
				const list_columns_date = [];
				for (const item of JSON.parse(fieldsPattern)) {
					if (item.type === 'date') {
						list_columns_date.push(item.name);
					}
				}

				//building the ES query
				const requestBody = esb.boolQuery();
				for (const item of JSON.parse(filters).filter) {
					if (item.meta.disabled === false) {
						switch (item.meta.negate) {
							case false:
								switch (item.meta.type) {
									case 'phrase':
										requestBody.must(
											esb.matchPhraseQuery(
												item.meta.key,
												item.meta.params.query
											)
										);
										break;
									case 'exists':
										requestBody.must(esb.existsQuery(item.meta.key));
										break;
									case 'phrases':
										if (item.meta.value.indexOf(',') > -1) {
											const valueSplit = item.meta.value.split(', ');
											for (const [key, incr] of valueSplit.entries()) {
												requestBody.should(
													esb.matchPhraseQuery(item.meta.key, incr)
												);
											}
										} else {
											requestBody.should(
												esb.matchPhraseQuery(
													item.meta.key,
													item.meta.params.query
												)
											);
										}
										requestBody.minimumShouldMatch(1);
										break;
								}
								break;
							case true:
								switch (item.meta.type) {
									case 'phrase':
										requestBody.mustNot(
											esb.matchPhraseQuery(
												item.meta.key,
												item.meta.params.query
											)
										);
										break;
									case 'exists':
										requestBody.mustNot(esb.existsQuery(item.meta.key));
										break;
									case 'phrases':
										if (item.meta.value.indexOf(',') > -1) {
											const valueSplit = item.meta.value.split(', ');
											for (const [key, incr] of valueSplit.entries()) {
												requestBody.should(
													esb.matchPhraseQuery(item.meta.key, incr)
												);
											}
										} else {
											requestBody.should(
												esb.matchPhraseQuery(
													item.meta.key,
													item.meta.params.query
												)
											);
										}
										requestBody.minimumShouldMatch(1);
										break;
								}
								break;
						}
					}
				}

				//search part
				let searchQuery = JSON.parse(filters)
					.query.query.replace(/ and /g, ' AND ')
					.replace(/ or /g, ' OR ')
					.replace(/ not /g, ' NOT ');
				logger.info('searchQuery is ', searchQuery);
				if (searchQuery) {
					requestBody.must(esb.queryStringQuery(searchQuery));
				}
				if (
					resIndexPattern.timeFieldName &&
					resIndexPattern.timeFieldName.length > 0
				) {
					header_search.push(resIndexPattern.timeFieldName);
					if (fields_exist) {
						strColumns.push(resIndexPattern.timeFieldName);
					}
					requestBody.must(
						esb
							.rangeQuery(resIndexPattern.timeFieldName)
							.format('epoch_millis')
							.gte(time_range_gte)
							.lte(time_range_lte)
					);
				}

				const reqBodyCount = esb.requestBodySearch().query(requestBody);
				const resCount = await this.esFetchCount(
					_req,
					resIndexPattern.title,
					reqBodyCount.toJSON()
				).catch((err) => {
					this.updateCSV(
						_req,
						documentId,
						'failed',
						nullBinary,
						'Err While Fetching the count in ES',
						username,
						strFilename
					);
				});

				if (resCount.count > MAX_ROWS) {
					this.updateCSV(
						_req,
						documentId,
						'failed',
						nullBinary,
						'Data too large.',
						username,
						strFilename
					);
					return { ok: false, resp: 'file is too large!' };
				}

				const strSort = savedSearchInfos._source.search.sort;
				const sorting = '';
				const reqBody = esb
					.requestBodySearch()
					.query(requestBody)
					.version(true)
					.size(10000);

				if (strSort.length > 0) {
					if (strSort.length === 1)
						reqBody.sort(esb.sort(strSort[0][0], strSort[0][1]));
					else reqBody.sort(esb.sort(strSort[0], strSort[1]));
				}

				if (fields_exist) {
					reqBody.source({ includes: strColumns });
				}

				//Fecth the data from ES
				const resData = await this.esFetchData(
					_req,
					resIndexPattern.title,
					reqBody.toJSON(),
					list_columns_date
				);
				if (resCount.count === 0) {
					this.updateCSV(
						_req,
						documentId,
						'failed',
						nullBinary,
						'No Content.',
						username,
						strFilename
					);
					return { ok: false, resp: 'No Content in elasticsearch!' };
				}
				logger.info('resCount.count is ', resCount.count);

				const arrayHits = [];
				logger.info('resData.hits.total.value ', resData.hits.total.value);
				arrayHits.push(resData.hits);

				console.log('resCount.count is ', resCount.count);

				const nb_countDiv = resCount.count / 10000;
				console.log('nb_countDiv ', nb_countDiv);

				//perform the scroll
				if (nb_countDiv > 0) {
					for (let i = 0; i < nb_countDiv + 1; i++) {
						let resScroll = await this.esFetchScroll(_req, resData._scroll_id);
						if (Object.keys(resScroll.hits.hits).length > 0) {
							arrayHits.push(resScroll.hits);
						}
					}
				}

				//No data in elasticsearch
				if (resData.hits.total.value === 0) {
					try {
						this.updateCSV(
							_req,
							documentId,
							'failed',
							nullBinary,
							'No Content in elasticsearch!',
							username,
							strFilename
						);
					} catch (err) {
						return { ok: false, resp: 'No Content in Elasticsearch ' };
					}
				}
				if (fields_exist === true) {
					header = header_search; //get the selected fields
				}

				logger.info('arrayHits.length is ', arrayHits.length);

				//Get data
				for (const valueRes of arrayHits) {
					for (const data_ of valueRes.hits) {
						const fields = data_.fields;
						for (let dateType of list_columns_date) {
							if (data_._source[dateType]) {
								data_._source[dateType] = moment(fields[dateType][0]).format(
									EXCEL_FORMAT
								);
							}
						}
						delete data_['fields'];
						if (fields_exist === true) {
							const result = this.traverse(data_, header_search);
							dataset.push(result);
							//dataset.push(data_);
						} else {
							dataset.push(data_);
						}
					}
				}

				const datasetSize = JSON.stringify(dataset).length;
				if (csvSeparator) delimiter.push(csvSeparator);
				else delimiter.push(',');
				const options = {
					delimiter: { field: delimiter.toString() },
					emptyFieldValue: EMPTY_FIELD_VALUE,
				};
				// csv.stringify(dataset, function(err, output){
				//   console.log('nodecsv is ', output);
				//   });

				converter
					.json2csvAsync(dataset, options)
					.then((csv) => {
						const buf = Buffer.from(JSON.stringify(csv)).toString('base64');
						const csvSize = JSON.stringify(csv).length;
						try {
							this.updateCSV(
								_req,
								documentId,
								'success',
								buf,
								'Succesfully Generated',
								username,
								strFilename
							);
						} catch (err) {
							this.updateCSV(
								_req,
								documentId,
								'failed',
								nullBinary,
								'Error while updating the index ' + err,
								username,
								strFilename
							);
							logger.error(
								'Reporting - GenerateService - genereteReport: Error while updating the index ',
								err
							);
							return {
								ok: false,
								resp: 'Error while updating the index ' + err,
							};
						}
					})
					.catch((err) => {
						this.updateCSV(
							_req,
							documentId,
							'failed',
							nullBinary,
							err,
							username,
							strFilename
						);
						logger.error(
							'Reporting - GenerateService - genereteReport: Error while converting to csv ',
							err
						);
						return { ok: false, resp: 'Error while converting to csv ', err };
					});
			}
		}
	};

	createPendingReport = async (_req) => {
		const time_range_gte = _req.params.start;
		const time_range_lte = _req.params.end;
		const savedsearchId = _req.params.savedsearchId;
		const username = _req.params.username;
		const count = await this.countUserReports(_req, username);
		const savedSearchInfos = await this.getSavedSearchInfo(_req, savedsearchId);
		const stripSpaces = savedSearchInfos._source.search.title
			.split(' ')
			.join('_');
		const strFilename =
			stripSpaces + '_' + time_range_gte + '_' + time_range_lte + '.csv';
		const nullBinary = 'bnVsbA==';

		if (count.count >= CSV_BY_USERS) {
			const doc = await this.getOldestReport(_req, username);
			if (username != 'Guest') {
				//logger.info('doc is ', doc);
				const doc_id = doc.hits.hits[0]._id;
				await this.deleteReport(_req, doc_id);
			}
		}

		const document = await this.saveReport(
			_req,
			strFilename,
			'pending',
			nullBinary,
			'Csv being Generated',
			username,
			'csv'
		);
		this.genereteReport(_req, document._id, username, strFilename);
		return { ok: true, resp: 'csv file pending...' };
	};
}
