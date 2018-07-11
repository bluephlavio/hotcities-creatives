const _ = require('underscore');
const p5 = require('p5');

const mapboxToken = 'pk.eyJ1IjoiYmx1ZXBobGF2aW8iLCJhIjoiY2ppMGFlNGhnMDAzcTNwcGpxbXA1dHAxdiJ9.wxN7uepuQStutK1vvxFzBg';

const opts = {
	size: [1024, 512],
	centerGeoCoords: [0, 0],
	angles: [0, 0],
	zoom: 2
}

const mapUri = `https://api.mapbox.com/styles/v1/mapbox/dark-v9/static/${opts.centerGeoCoords.join(',')},${opts.zoom},${opts.angles.join(',')}/${opts.size.join('x')}?access_token=${mapboxToken}`;

const canvasContainer = document.getElementById('canvas-container');

function getCanvasSize() {
	return [canvasContainer.clientWidth, canvasContainer.clientHeight];
}

let s = (sketch) => {

	let mapImg;

	sketch.preload = () => {
		mapImg = sketch.loadImage(mapUri);
	}

	sketch.windowResized = () => {
		sketch.resizeCanvas(...getCanvasSize());
	}

	sketch.setup = () => {
		sketch.createCanvas(...getCanvasSize())
			.parent('canvas-container');
	}

	sketch.draw = () => {
		sketch.translate(...getCanvasSize()
			.map(coord => coord / 2));
		sketch.background(10);
		sketch.imageMode(sketch.CENTER);
		sketch.image(mapImg, 0, 0);
		sketch.ellipse(0, 0, 10, 10);
	}

}

const p = new p5(s);