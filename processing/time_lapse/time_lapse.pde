String mapboxToken = "pk.eyJ1IjoiYmx1ZXBobGF2aW8iLCJhIjoiY2ppMGFlNGhnMDAzcTNwcGpxbXA1dHAxdiJ9.wxN7uepuQStutK1vvxFzBg";

String style = "bluephlavio/cjin553wo0vr92rrynvsksfuv";
int sizeX = 1024;
int sizeY = 720;
int centerX = 0;
int centerY = 0;
int zoom = 1;

String mapURI = "https://api.mapbox.com/styles/v1/" + style + "/static/" + 
  centerX + "," + centerY + "," + zoom + ",0,0/" + sizeX + "x" + sizeY + 
  "?access_token=" + mapboxToken;

PImage mapImg = null;

String fontURI = "./fonts/Quicksand-Bold.otf";

PFont font;

JSONArray cities;
JSONArray records;

float minTemp;
float maxTemp;
int maxCount = 1;
int oldRecordsCount = 100;

int bgColor = #191a1a;
int dataColor = #fc900c;
int textSize = 15;
int letterSpacing = 13;
int textYOffset = 170;
int lineHeight = 15;
int minRadius = 10;
int maxRadius = 100;
int minAlpha = 0;
int maxAlpha = 255;
float fadeOutFactor = 2;
float collapseFactor = 1;
int fps = 60;

float t = 0;
float dt = 1;

boolean recording = false;

float[] merc(float lng, float lat) {
  float[] coords = new float[2];
  coords[0] = 512 / TWO_PI * pow(2, zoom) * (radians(lng) + PI);
  coords[1] = 512 / TWO_PI * pow(2, zoom) * (PI - log(tan(PI / 4 + radians(lat) / 2)));
  return coords;
}

int getAlpha(float temp) {
 return (int) map(temp, minTemp, maxTemp, minAlpha, maxAlpha); 
}

int getRadius(int count) {
 return (int) map(count, 1, maxCount, minRadius, maxRadius); 
}

void renderRecordData(JSONObject record, int oldIndex) {
  JSONObject city = record.getJSONObject("city");
  float lng = city.getFloat("lng");
  float lat = city.getFloat("lat");
  float[] screenCoords = merc(lng, lat);
  float[] screenCoordsCenter = merc(0, 0);
  float[] screenCoordsWRTCenter = {screenCoords[0] - screenCoordsCenter[0], screenCoords[1] - screenCoordsCenter[1]};
  float temp = record.getFloat("temp");
  int count = record.getInt("count");
  int alpha =  max(getAlpha(temp) - (int) (fadeOutFactor * oldIndex), 0);
  int radius = max(getRadius(count) - (int) (collapseFactor * oldIndex), 0);
  fill(dataColor, alpha);
  stroke(dataColor, alpha);
  ellipse(screenCoordsWRTCenter[0], screenCoordsWRTCenter[1], radius, radius);
}

void renderText(String text, int x, int y, int mode) {
  textAlign(CENTER);
  for (int i = 0; i < text.length(); i++) {
    char c = text.charAt(i);
    if (mode == LEFT) {
      text(c, x + i * letterSpacing, y);
    } else if (mode == RIGHT) {
      text(c, x - (text.length() - i) * letterSpacing, y);
    } else {
      int width = text.length() * letterSpacing;
      text(c, x - (int) (width / 2) + i * letterSpacing, y);
    }
  }
}

void renderRecordText(JSONObject record) {
  float temp = record.getFloat("temp");
  float alpha = getAlpha(temp);
  stroke(dataColor, alpha);
  fill(dataColor, alpha);
  textAlign(RIGHT, CENTER);
  JSONObject city = record.getJSONObject("city");
  String name = city.getString("name");
  renderText(name + "|", 0, textYOffset, RIGHT);
  String formattedTemp = round(temp) + " °C";
  renderText(formattedTemp, 0, textYOffset, LEFT);
  String timestamp = record.getString("timestamp");
  String formattedTimestamp = timestamp.replace("T", " ").substring(0, 16);
  stroke(dataColor, 100);
  fill(dataColor, 100);
  renderText(formattedTimestamp, 0, textYOffset + lineHeight, LEFT);
}

void keyPressed() {
  if (key == 'r') {
    recording = !recording;
  }
}

void setup() {
  mapImg = loadImage(mapURI, "jpg");
  cities = loadJSONArray("../../data/cities.json");
  records = loadJSONArray("../../data/records.json");
  for (int i = 0; i < records.size(); i++) {
    JSONObject record = records.getJSONObject(i);
    int geonameid = record.getInt("geonameid");
    float temp = record.getFloat("temp");
    if (i == 0) {
      minTemp = temp;
      maxTemp = temp;
      record.setInt("count", 1);
    } else {
      if (temp < minTemp) minTemp = temp;
      if (temp > maxTemp) maxTemp = temp;
      JSONObject lastRecord = records.getJSONObject(i - 1);
      if (lastRecord.getInt("geonameid") == geonameid) {
        record.setInt("count", lastRecord.getInt("count") + 1);
        int count = record.getInt("count");
        if (count > maxCount) maxCount = count;
      } else {
        record.setInt("count", 1);
      }
    }
    for (int j = 0; j < cities.size(); j++) {
      JSONObject city = cities.getJSONObject(j);
      if (city.getInt("geonameid") == geonameid) {
        record.setJSONObject("city", city);
      }
    }
  }
  font = createFont(fontURI, textSize);
  textFont(font);
  size(1024, 720);
}

void draw() {
  translate(sizeX / 2, sizeY / 2);
  imageMode(CENTER);
  image(mapImg, 0, 0);
  int index = (int) floor(t) % records.size();
  JSONObject record = (JSONObject) records.get(index);
  renderRecordData(record, 0);
  renderRecordText(record);
  JSONObject[] oldRecords;
  if (index < oldRecordsCount) {
    oldRecords = new JSONObject[index];
    for (int i = 0; i < index; i++) {
      oldRecords[i] = (JSONObject) records.get(i);
    }
  }
  else {
    oldRecords = new JSONObject[oldRecordsCount];
    for (int i = 0; i < oldRecordsCount; i++) {
      oldRecords[i] = (JSONObject) records.get(index - i - 1);
    }
  }
  for (int i = 0; i < oldRecords.length; i++) {
    JSONObject oldRecord = oldRecords[i];
    renderRecordData(oldRecord, i);
  }
  
  if (recording) {
    saveFrame("output/####.png");
  }
  
  t += dt;
}
