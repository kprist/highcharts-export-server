function generateChartOptions(title, subtitle, data) {
	// group by col_id
	var colGroups = _.groupBy(data, function(dataRow) {
		return dataRow[2];
	});

	var rowHeaders = _.sortBy(
		 _.uniq(
			_.map(data, function(dataRow) {
				// row labels have to be non empty!
				return {
					id: dataRow[1],
					label: dataRow[3] || ("Record " + dataRow[1])
				};
			}),
			"id"
		),
		 "label"
	);

	var columns = _.map(colGroups, function(dataRows, columnId) {
		var columnData = _.map(rowHeaders, function(rowHeader) {
			// find the (only) dataRow with the row id of the header
			var dataRow = _.find(dataRows, function(dataRow) {
				return rowHeader.id == dataRow[1];
			});

			// and return its value OR null if it's not found
			return (dataRow && dataRow[0]) || null;
		});

		// all dataRows have same column id/value, 
		// so columnData first element is the column value of the first datarow
		columnData.unshift(dataRows[0][4]);

		return columnData;
	});

	// sort column items by column name (first in list)
	columns = _.sortBy(columns, function(column) {
		return column[0];
	});

	// the first item of the columns array is the list of row labels
	var header = _.pluck(rowHeaders, "label");
	// add an extra item at the start of the headers list
	header.unshift("");

	columns.unshift(header);

	return {
		chart: {
			type: 'column'
		},

		title: {
			text: title
		},

		subtitle: {
			text: subtitle
		},

		data: {
			columns: columns,
			switchRowsAndColumns: true
		}
	};
}

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
		}],
		chart: {
			events: {
				load: function() {
					zoomToMapFeatures(this, this.series[0], Highcharts.maps[mapDataName], joinByField);
				}
			}
		}

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

function zoomToMapFeatures(map, dataSeries, mapData, joinByField) {
	var codes = _.compact(_.uniq(_.pluck(dataSeries.data, 'code')));

	var selectedFeatures = turf.featurecollection(_.filter(mapData.features, function(f) {
		return _.contains(codes, f.properties[joinByField]);
	}));

	// leave the map alone if empty map
	if (!_.size(selectedFeatures.features)) return;

	var selectedBBox = turf.extent(selectedFeatures);

	var center = turf.center(selectedFeatures).geometry.coordinates;

	var bbox = turf.extent(mapData);

	var zoomHeight = (selectedBBox[3] - selectedBBox[1]) / (bbox[3] - bbox[1]);
	var zoomWidth = (selectedBBox[2] - selectedBBox[0]) / (bbox[2] - bbox[0]);

	var zoomFactor = Math.max(zoomHeight, zoomWidth);

	// Highcharts is impossible!!! the y-coordinates must be flipped!!! (???)
	map.mapZoom(zoomFactor, center[0], -center[1]);
}
