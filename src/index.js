import * as maplibregl from "maplibre-gl";
import * as pmtiles from 'pmtiles';
import 'maplibre-gl/dist/maplibre-gl.css';
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import '@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css';
import './style.css';

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles",protocol.tile);

const basemapNames = ["白地図","地図（OpenStreetMap）","航空画像","陰影起伏図","背景地図なし"];
const flagNames = ["basemap-GSIblank","basemap-OSM","basemap-GSIphoto","basemap-GSIhillshade","background"];
let target_basemap = 0;

const basemapLength = basemapNames.length;
for (let i = 0; i < basemapLength; i++) {
    const selectBasemap = document.getElementById('basemap-id');
    const optionName = document.createElement('option');
    optionName.value = basemapNames[i];
    optionName.textContent = basemapNames[i];
    selectBasemap.appendChild(optionName);
}

const selected_basemap = document.querySelector('.basemap-select');

const descriptionBox = document.getElementById('description');
let descriptionContent = '';
descriptionContent += '<h2>チーバくんの地図あわせマップ</h2>';
descriptionContent += '<p class="tipstyle01">千葉県に住む不思議ないきもの、チーバくんの姿と千葉県の形を地図上にできるだけぴったり重ねたマップ。非公式ファンアートとなります。チーバくんと実際の地図の駅名や地名を照らし合わせたりできます。</p>';
descriptionContent += '<p class="tipstyle01">ご意見等は<a href="https://form.run/@party--1681740493" target="_blank">問い合わせフォーム（外部サービス）</a>からお知らせください。</p>';
descriptionContent += '<hr><p class="remarks">地図描画ライブラリ：<a href="https://maplibre.org/">MapLibre</a>.<br>ベースマップ：<a href="https://www.openstreetmap.org/">OpenStreetMap</a> | <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>.<br>位置参照情報 : <a href="https://nlftp.mlit.go.jp/cgi-bin/isj/dls/_choose_method.cgi">国土交通省</a>と<a href="https://www.pref.chiba.lg.jp/index.html">千葉県</a>の情報を独自に加工</p>';
descriptionContent += '<hr><p class="remarks">View code on <a href="https://github.com/sanskruthiya/chibakun-map">Github</a></p>';
descriptionBox.innerHTML = descriptionContent;

const bx_layer = document.getElementById('bx-layer');
bx_layer.innerHTML = '<div><label class="tLabel"><input type="checkbox" id="cbox_railway">鉄道駅・路線</label><label class="tLabel"><input type="checkbox" id="cbox_city">市区町村境界</label></div>';

const bx_setting = document.getElementById('bx-setting');
bx_setting.innerHTML = '<div><input type="range" id="slider_color" min="0" max="10" value="8"><span id="slider_cValue">80%</span></div>'

const init_coord = [140.1992, 35.4895];
const init_zoom = 7.5;
const init_bearing = 0;
const init_pitch = 0;

const map = new maplibregl.Map({
    container: 'map',
    //style: 'https://tile2.openstreetmap.jp/styles/osm-bright-ja/style.json',
    style: {"version":8,"name":"blank","center":[0,0],"zoom":1,"bearing":0,"pitch":0,"sources":{"plain":{"type":"vector","url":""}},"sprite":"","glyphs":location.href+"app/fonts/{fontstack}/{range}.pbf","layers":[{"id":"background","type":"background","paint":{"background-color":"#f0f8ff"}}],"id":"blank"},
    localIdeographFontFamily: ['sans-serif'],
    center: init_coord,
    interactive: true,
    zoom: init_zoom,
    minZoom: 5,
    maxZoom: 21,
    maxBounds: [[110.0000, 25.0000],[170.0000, 50.0000]],
    bearing: init_bearing,
    pitch: init_pitch,
    attributionControl: true,
    hash: false
});

map.on('load', () => {
    map.addSource('basemap_GSIblank', {
        'type': 'raster',
        'tiles': ['https://cyberjapandata.gsi.go.jp/xyz/blank/{z}/{x}/{y}.png'],
        'tileSize': 256,
        'minzoom': 5,
        'maxzoom': 14,
        'attribution': '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    });
    map.addSource('basemap_OSM', {
        'type': 'raster',
        'tiles': ['https://tile.openstreetmap.jp/styles/osm-bright-ja/{z}/{x}/{y}.png'],
        'tileSize': 256,
        'minzoom': 5,
        'maxzoom': 20,
        'attribution': '<a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    });
    map.addSource('basemap_GSIphoto', {
        'type': 'raster',
        'tiles': ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
        'tileSize': 256,
        'minzoom': 5,
        'maxzoom': 18,
        'attribution': '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    });
    map.addSource('basemap_GSIhillshade', {
        'type': 'raster',
        'tiles': ['https://cyberjapandata.gsi.go.jp/xyz/hillshademap/{z}/{x}/{y}.png'],
        'tileSize': 512,
        'minzoom': 5,
        'maxzoom': 16,
        'attribution': '<a href="https://maps.gsi.go.jp/development/ichiran.html">地理院タイル</a>',
    });
    
    map.addSource('chibakun', {
        'type': 'vector',
        'url': 'pmtiles://app/data/chibakun_map.pmtiles',
        "minzoom": 5,
        "maxzoom": 12,
    });
    map.addSource('cityname', {
        'type': 'geojson',
        'data': './app/data/cityname_chiba.geojson',
    });
    map.addSource('station', {
        'type': 'geojson',
        'data': './app/data/station_chiba.geojson',
    });
   
    map.addLayer({
        'id': 'basemap-GSIblank',
        'type': 'raster',
        'source': 'basemap_GSIblank',
        'layout': {
            'visibility': 'visible',
        },
    });
    map.addLayer({
        'id': 'basemap-OSM',
        'type': 'raster',
        'source': 'basemap_OSM',
        'layout': {
            'visibility': 'none',
        },
    });
    map.addLayer({
        'id': 'basemap-GSIphoto',
        'type': 'raster',
        'source': 'basemap_GSIphoto',
        'layout': {
            'visibility': 'none',
        },
    });
    map.addLayer({
        'id': 'basemap-GSIhillshade',
        'type': 'raster',
        'source': 'basemap_GSIhillshade',
        'layout': {
            'visibility': 'none',
        },
    });
    map.addLayer({
        'id': 'hexgrid-a',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'layout': {
            },
            'paint': {
                'fill-color': ["step", ["get", "color_flag"],'#fb9a99',1,'#555555',2,'#fff',3,'#555555',4,'#555555',5,'#fb9a99'],
                'fill-opacity': 0.8,
            }
    });
    map.addLayer({
        'id': 'cityarea',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'cityarea_chiba',
        'layout': {
            'visibility': 'none',
        },
        'paint': {
            'fill-color': '#fff',
            'fill-outline-color': '#555',
            'fill-opacity': 0.8,
        }
    });
    map.addLayer({
        'id': 'railway1',
        'type': 'line',
        'source': 'chibakun',
        'source-layer': 'railway_chiba',
        'layout': {
            'visibility': 'none',
            'line-join': 'round',
            'line-cap': 'round'
        },
        'paint': {
            'line-color': '#1e90ff',
            'line-opacity': 0.8,
            'line-blur': 2,
            'line-width': 6
        }
    });
    map.addLayer({
        'id': 'railway2',
        'type': 'line',
        'source': 'chibakun',
        'source-layer': 'railway_chiba',
        'layout': {
            'visibility': 'none',
            'line-join': 'bevel',
            'line-cap': 'butt'
        },
        'paint': {
            'line-color': '#fff',
            'line-opacity': 1,
            'line-width': 1
        }
    });
    map.addLayer({
        'id': 'admin-city',
        'type': 'symbol',
        'source': 'cityname',
        "minzoom": 7,
        'layout': {
            'visibility': 'none',
            'icon-image': '',
            'text-field': '{city_name}',
            'text-font': ["NotoSans-SemiBold"],
            'text-anchor': 'top',
            'text-allow-overlap': true,
            'text-size': ['interpolate',['linear'],['zoom'],5,8,8,11,15,18],
            'text-offset': [0,0]
        },
        'paint':{
            'text-color': '#555',
        }
    });
    map.addLayer({
        'id': 'station',
        'type': 'symbol',
        'source': 'station',
        "minzoom": 5,
        'layout': {
            'visibility': 'none',
            'icon-image': '',
            'text-field': '{name_alias}',
            'text-font': ["NotoSans-Regular"],
            'symbol-sort-key': ['get', 'oid'],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-size': ['interpolate',['linear'],['zoom'],5,10,8,11,15,16],
            'text-offset': [0,0]
        },
        'paint':{
            'text-color': '#555',
            'text-halo-color': '#fff',
            'text-halo-width': 1,
        }
    });
    
    map.on('click', 'hexgrid-a', function (e) {
        let fquery_01 = map.queryRenderedFeatures(e.point, { layers: ['station'] })[0] !== undefined ? map.queryRenderedFeatures(e.point, { layers: ['station'] })[0].properties : "no-layer";
        let c_flag;
        if(e.features[0].properties.r_point == 1){
            c_flag = '';
        }else if(e.features[0].properties.r_point > 1){
            c_flag = 'のあたりだよ。';
        }else if(e.features[0].properties.r_point == 0){
            c_flag = 'の近くだよ。';
        }else{
            c_flag = '';
        };

        new maplibregl.Popup({closeButton: true, className:"t-popup", maxWidth:'280px'})
        .setLngLat(e.lngLat)
        .setHTML('<p class="tipstyle01">' + e.features[0].properties.r_name + c_flag + (fquery_01 !== "no-layer" ? '<br>' + fquery_01["railway_class"] + 'の' + fquery_01["name_alias"] + '駅があるよ。': '') + '</p>')
        .addTo(map);
        });
         
        map.on('mouseenter', 'hexgrid-a', function () {
        map.getCanvas().style.cursor = 'pointer';
        });
         
        map.on('mouseleave', 'hexgrid-a', function () {
        map.getCanvas().style.cursor = '';
    });
    
    selected_basemap.addEventListener('change', () => {
        target_basemap = selected_basemap.selectedIndex;
        map.setLayoutProperty('basemap-OSM', 'visibility', 'none');
        map.setLayoutProperty('basemap-GSIphoto', 'visibility', 'none');
        map.setLayoutProperty('basemap-GSIblank', 'visibility', 'none');
        map.setLayoutProperty('basemap-GSIhillshade', 'visibility', 'none');
        if (target_basemap < 4) {
            map.setLayoutProperty(flagNames[target_basemap], 'visibility', 'visible');
        }
    });

    const checkbox1 = document.getElementById('cbox_railway');
    checkbox1.addEventListener('change', function(event) {
        if (event.target.checked) {
            map.setLayoutProperty('railway1', 'visibility', 'visible');
            map.setLayoutProperty('railway2', 'visibility', 'visible');
            map.setLayoutProperty('station', 'visibility', 'visible');
        } else {
            map.setLayoutProperty('railway1', 'visibility', 'none');
            map.setLayoutProperty('railway2', 'visibility', 'none');
            map.setLayoutProperty('station', 'visibility', 'none');
        }
    });
    const checkbox2 = document.getElementById('cbox_city');
    checkbox2.addEventListener('change', function(event) {
        if (event.target.checked) {
            map.setLayoutProperty('cityarea', 'visibility', 'visible');
            map.setLayoutProperty('admin-city', 'visibility', 'visible');
        } else {
            map.setLayoutProperty('cityarea', 'visibility', 'none');
            map.setLayoutProperty('admin-city', 'visibility', 'none');
        }
    });

    let valueTR;
    document.getElementById('slider_color').addEventListener('input', function(){
        valueTR = Number(this.value)*10;
        document.getElementById('slider_cValue').textContent = String(valueTR)+'%';
        map.setPaintProperty('hexgrid-a', 'fill-opacity', valueTR/100);
    });
});

document.getElementById('b_description').style.backgroundColor = "#fff";
document.getElementById('b_description').style.color = "#333";
document.getElementById('description').style.display ="none";

document.getElementById('b_setting').style.backgroundColor = "#2c7fb8";
document.getElementById('b_setting').style.color = "#fff";
document.getElementById('map-setting').style.display ="block";

document.getElementById('b_location').style.backgroundColor = "#fff";
document.getElementById('b_location').style.color = "#333";

document.getElementById('b_description').addEventListener('click', function () {
    const visibility = document.getElementById('description');
    if (visibility.style.display == 'block') {
        visibility.style.display = 'none';
        this.style.backgroundColor = "#fff";
        this.style.color = "#555"
    }
    else {
        visibility.style.display = 'block';
        this.style.backgroundColor = "#2c7fb8";
        this.style.color = "#fff";
    }
});

document.getElementById('b_setting').addEventListener('click', function () {
    const visibility = document.getElementById('map-setting');
    if (visibility.style.display == 'block') {
        visibility.style.display = 'none';
        this.style.backgroundColor = "#fff";
        this.style.color = "#555"
    }
    else {
        visibility.style.display = 'block';
        this.style.backgroundColor = "#2c7fb8";
        this.style.color = "#fff";
    }
});

const geocoderApi = {
    forwardGeocode: async (config) => {
        const features = [];
        try {
            const request =
        `https://nominatim.openstreetmap.org/search?q=${
            config.query
        }&format=geojson&polygon_geojson=1&addressdetails=1`;
            const response = await fetch(request);
            const geojson = await response.json();
            for (const feature of geojson.features) {
                const center = [
                    feature.bbox[0] +
                (feature.bbox[2] - feature.bbox[0]) / 2,
                    feature.bbox[1] +
                (feature.bbox[3] - feature.bbox[1]) / 2
                ];
                const point = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: center
                    },
                    place_name: feature.properties.display_name,
                    properties: feature.properties,
                    text: feature.properties.display_name,
                    place_type: ['place'],
                    center
                };
                features.push(point);
            }
        } catch (e) {
            console.error(`Failed to forwardGeocode with error: ${e}`);
        }

        return {
            features
        };
    }
};

const geocoder = new MaplibreGeocoder(geocoderApi, {
        maplibregl,
        zoom: 10,
        placeholder: '場所を検索',
        collapsed: true,
        //bbox:[122.94, 24.04, 153.99, 45.56],
        countries:'ja',
        language:'ja'
    }
);
map.addControl(geocoder, 'top-left');

const loc_options = {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0
};

document.getElementById('icon-loader').style.display = 'none';

let popup_loc = new maplibregl.Popup({anchor:"top", focusAfterOpen:false});
let marker_loc = new maplibregl.Marker({draggable: true});
let flag_loc = 0;

document.getElementById('b_location').addEventListener('click', function () {
    this.setAttribute("disabled", true);
    if (flag_loc > 0) {
        marker_loc.remove();
        popup_loc.remove();
        this.style.backgroundColor = "#fff";
        this.style.color = "#333";
        flag_loc = 0;
        this.removeAttribute("disabled");
    }
    else {
        document.getElementById('icon-loader').style.display = 'block';
        this.style.backgroundColor = "#87cefa";
        this.style.color = "#fff";
        navigator.geolocation.getCurrentPosition(
            (position) => {
                marker_loc.remove();
                popup_loc.remove();
                document.getElementById('icon-loader').style.display = 'none';
                this.style.backgroundColor = "#2c7fb8";
                this.style.color = "#fff";

                let c_lat = position.coords.latitude;
                let c_lng = position.coords.longitude;
            
                map.jumpTo({
                    center: [c_lng, c_lat],
                    zoom: init_zoom + 1,
                });
                
                popup_loc.setLngLat([c_lng, c_lat]).setHTML('<p class="tipstyle02">現在地はここだよ！<br>ピンはドラッグすると自分で動かせるよ。</p>').addTo(map);
                marker_loc.setLngLat([c_lng, c_lat]).addTo(map);
                flag_loc = 1;
                this.removeAttribute("disabled");
            },
            (error) => {
                popup_loc.remove();
                document.getElementById('icon-loader').style.display = 'none';
                this.style.backgroundColor = "#999";
                this.style.color = "#fff";
                console.warn(`ERROR(${error.code}): ${error.message}`)
                map.flyTo({
                    center: init_coord,
                    zoom: init_zoom,
                    speed: 1,
                });
                popup_loc.setLngLat(init_coord).setHTML('現在地が取得できませんでした').addTo(map);
                flag_loc = 2;
                this.removeAttribute("disabled");
            },
            loc_options
        );
    }
});
