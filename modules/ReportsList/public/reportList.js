// get the latest 10 reports by the user.
getCsvReports = () => {
	const { httpClient } = this.props;
	return httpClient
		.get(chrome.addBasePath('/api/reporting/csv/reportsList'))
		.then((res) => {
			this.setState({ recentCsv: res.data.resp });
			if (this.state.recentCsv.length !== 0) {
				this.setState({ hideCsvItem: false });
			}
			return { ok: true, resp: res.data };
		})
		.catch((error) => {
			if (error) {
				toastNotifications.addDanger(
					'An Error Occurred While fetching the recent generated csv'
				);
				return { ok: false, resp: error.message };
			}
		});
};
