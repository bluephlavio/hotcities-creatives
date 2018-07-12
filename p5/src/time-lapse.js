const path = require('path');
const _ = require('underscore');
const $ = require('jquery');
const p5 = require('p5');

// canvas
const canvasContainer = $('#canvas-container')
	.get(0);

function getCanvasSize() {
	return [canvasContainer.clientWidth, canvasContainer.clientHeight];
}

// mapbox
const mapboxToken = 'pk.eyJ1IjoiYmx1ZXBobGF2aW8iLCJhIjoiY2ppMGFlNGhnMDAzcTNwcGpxbXA1dHAxdiJ9.wxN7uepuQStutK1vvxFzBg';

const opts = {
	size: [1024, 900],
	centerGeoCoords: [0, 0],
	angles: [0, 0],
	zoom: 1
}

const mapUri = `https://api.mapbox.com/styles/v1/bluephlavio/cjin553wo0vr92rrynvsksfuv/static/${opts.centerGeoCoords.join(',')},${opts.zoom},${opts.angles.join(',')}/${opts.size.join('x')}?access_token=${mapboxToken}`;

// hotcities.world
const apiEndpoint = 'http://www.hotcities.world/api/';
const citiesJsonFile = path.join(__dirname, '..', '..', 'data', 'cities.json');
const recordsJsonFile = path.join(__dirname, '..', '..', 'data', 'records.json');

// web mercator
function webMerc(lng, lat, zoom) {
	const PI = Math.PI;
	const LONGITUDE = lng * PI / 180;
	const LATITUDE = lat * PI / 180;
	const exp = Math.pow;
	const ln = Math.log;
	const tan = Math.tan;
	let x = 512 / (2 * PI) * exp(2, zoom) * (LONGITUDE + PI);
	let y = 512 / (2 * PI) * exp(2, zoom) * (PI - ln(tan(PI / 4 + LATITUDE / 2)));
	return [x, y];
}

// colors and graphics
const bgColor = [25, 26, 26];
const dataColor = [252, 144, 12];
const textSize = 13;
const textPosition = [0, 170];
const minRadius = 15;
const maxRadius = 100;
const minAlpha = 10;
const maxAlpha = 255;
const fadeOutFactor = 25;
const collapseFactor = 10;
const fps = 60;

// sketch
let s = (sketch) => {

	let mapImg;

	let cities;
	let records;
	let maxTemp;
	let minTemp;
	let maxCount;
	let maxTotalCount;

	const dt = 1;
	let t = 0;

	function renderRecordData(record, oldIndex = 0) {
		let screenCoords = webMerc(record.city.lng, record.city.lat, opts.zoom);
		let screenCoordsCenter = webMerc(0, 0, opts.zoom);
		let screenCoordsWRTCenter = screenCoords.map((coord, index) => coord - screenCoordsCenter[index]);

		let alpha = Math.max(sketch.map(record.temp, minTemp, maxTemp, minAlpha, maxAlpha) - fadeOutFactor * oldIndex, minAlpha);
		let radius = Math.max(sketch.map(record.count, 1, maxCount, minRadius, maxRadius) - collapseFactor * oldIndex, minRadius);

		sketch.fill(...dataColor, alpha);
		sketch.stroke(...dataColor, alpha);

		sketch.ellipse(...screenCoordsWRTCenter, radius, radius);
	}

	function renderRecordText(record) {
		let alpha = sketch.map(record.temp, minTemp, maxTemp, 10, 255);

		sketch.stroke(...dataColor, alpha);
		sketch.textStyle(sketch.NORMAL);

		sketch.textAlign(sketch.RIGHT, sketch.CENTER);
		sketch.text(`${record.city.name} `, ...textPosition);

		sketch.textAlign(sketch.CENTER, sketch.CENTER);
		sketch.text('|', ...textPosition);

		sketch.textAlign(sketch.LEFT, sketch.CENTER);
		sketch.text(` ${Math.round(record.temp)} °C`, ...textPosition);
	}

	function renderTimestamp(record) {
		sketch.stroke(...dataColor, 100);
		sketch.textStyle(sketch.NORMAL);

		sketch.textAlign(sketch.LEFT, sketch.CENTER);
		sketch.text(` ${record.timestamp.replace('T', ' ').substr(0, 16)}`, textPosition[0], textPosition[1] + 20);
	}

	sketch.preload = () => {
		mapImg = sketch.loadImage(mapUri);
		sketch.loadJSON(citiesJsonFile, data => {
			cities = data;
			sketch.loadJSON(recordsJsonFile, data => {
				records = data;
				_.forEach(records, record => {
					record.city = _.find(cities, city => {
						return record.geonameid == city.geonameid;
					});
				});
				maxTemp = _.max(records.map(record => record.temp));
				minTemp = _.min(records.map(record => record.temp));
				_.each(records, (record, index, records) => {
					if (index == 0 || records[index - 1].geonameid !== record.geonameid) {
						record.count = 1;
					} else {
						record.count = records[index - 1].count + 1;
					}
					if (record.totalCount) {
						record.totalCount++;
					} else {
						record.totalCount = 1;
					}
				});
				maxCount = _.max(records.map(record => record.count));
				maxTotalCount = _.max(records.map(record => record.totalCount));
			});
		});
	}

	sketch.windowResized = () => {
		sketch.resizeCanvas(...getCanvasSize());
	}

	sketch.setup = () => {
		sketch.createCanvas(...getCanvasSize())
			.parent('canvas-container');
		sketch.frameRate(fps);
		sketch.textFont('Quicksand');
		sketch.textSize(textSize);
	}

	sketch.draw = () => {
		let center = getCanvasSize()
			.map(coord => coord / 2);
		sketch.translate(...center);

		sketch.background(...bgColor);
		sketch.imageMode(sketch.CENTER);
		sketch.image(mapImg, 0, 0);

		let index = Math.floor(t) % records.length;
		let record = records[index];
		renderRecordData(record);
		renderRecordText(record);

		let oldRecordsCount = 50;
		let oldRecords = records.slice(index - oldRecordsCount, index)
			.reverse();

		_.each(oldRecords, (oldRecord, index) => {
			renderRecordData(oldRecord, index);
		});

		renderTimestamp(record);

		t += dt;
	}

}

const p = new p5(s);