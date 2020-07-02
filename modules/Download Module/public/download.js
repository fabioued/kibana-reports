// Download the Report
download = (id) => {
	const url = chrome.addBasePath('/api/csv/reporting/download/' + id);
	const httpClient = this.props.httpClient;
	httpClient
		.get(url)
		.then((res) => {
			const FileSaver = require('file-saver');
			const report = new Blob([res.data.resp.report], {
				type: 'text/csv;charset=utf-8',
			});
			FileSaver.saveAs(report, res.data.resp.filename);
		})
		.then((error) => {
			if (error) {
				toastNotifications.addDanger(
					'An Error Occurred While downloading the file'
				);
				throw error;
			}
		});
};
