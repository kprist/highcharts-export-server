function generateMapOptions(label, data, mapDataName, joinByField) {

	return {
		title: {
			text: label
		},
		colorAxis: {
			dataClasses: seriesCKMeans(data)
		},
		series: [{
			name: label,
			data: data,
			mapData: Highcharts.maps[mapDataName],
			joinBy: [joinByField, 'code']
		}]
	};

}

function seriesCKMeans(seriesData, noOfClasses) {
	if (typeof noOfClasses === 'undefined') noOfClasses = 5;
	// first we need to make sure the 'value' attribute in the seriesData is numerical (float for general purpose)
	var values = [];
	_.each(seriesData, function(data) {
		var numeric = parseFloat(data.value);
		if (!isNaN(numeric)) {
			values.push(numeric);
		}
	});

	// make sure the classes are no more than the unique values in the dataset
	noOfClasses = Math.min(noOfClasses, _.size(_.uniq(values)))

	// next we calculate the breaks (jenks algorithm)
	var clusters = ss.ckmeans(values, noOfClasses);

// console.log(clusters);

	// this produces an array with the categories (noOfClasses elements)
	var categories = _.map(clusters, function(cluster) {
		var from = _.min(cluster);
		var to = _.max(cluster);
		return {
			from: from,
			to: to,
			name: "" + (from != to ? (from + " - " + to) : from)
		}
	});

	return categories;
}
