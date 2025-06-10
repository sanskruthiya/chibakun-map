import * as maplibregl from "maplibre-gl";
import * as pmtiles from 'pmtiles';
import MaplibreTerradrawControl from '@watergis/maplibre-gl-terradraw';
import '@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css';
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
descriptionContent += '<hr><p class="remarks">地図描画ライブラリ：<a href="https://maplibre.org/">MapLibre</a>.<br>ベースマップ：<a href="https://www.openstreetmap.org/">OpenStreetMap</a> | <a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院</a>.<br>位置参照情報 : <a href="https://nlftp.mlit.go.jp/cgi-bin/isj/dls/_choose_method.cgi">国土交通省</a>と<a href="https://www.pref.chiba.lg.jp/index.html">千葉県</a>の情報を独自に加工.<br>クイズ用データ : <a href="https://nlftp.mlit.go.jp/ksj/">国土数値情報</a>の「観光資源」及び「駅別乗降客数」情報を独自に加工</p>';
descriptionContent += '<hr><p class="remarks">View code on <a href="https://github.com/sanskruthiya/chibakun-map">GitHub</a></p>';
descriptionBox.innerHTML = descriptionContent;

const bx_layer = document.getElementById('bx-layer');
bx_layer.innerHTML = '<div><label class="tLabel"><input type="checkbox" id="cbox_railway">鉄道駅・路線</label><label class="tLabel"><input type="checkbox" id="cbox_city">市区町村境界</label></div>';

const bx_setting = document.getElementById('bx-setting');
bx_setting.innerHTML = '<div><input type="range" id="slider_color" min="0" max="10" value="8"><span id="slider_cValue">80%</span></div>'

// クイズ機能用の変数
let quizActive = false;
let quizData = [];
let currentQuiz = null;
let quizMarkers = [];
let correctMarker = null;
let consecutiveCorrect = 0; // 連続正解数
let bestRecord = 0; // 最高連続正解数
let quizHistory = []; // クイズの履歴を保存する配列
let totalQuizzes = 0; // 出題数
let correctAnswers = 0; // 正解数

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
    maxPitch: 85,
    maxBounds: [[110.0000, 25.0000],[170.0000, 50.0000]],
    bearing: init_bearing,
    pitch: init_pitch,
    attributionControl: true,
    hash: false
});

const drawControl = new MaplibreTerradrawControl({
    modes: ['point', 'linestring', 'circle', 'select'],//'polygon', 'rectangle', 'angled-rectangle', 'freehand'
    open: false,
});
map.addControl(drawControl, 'top-right');

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
        'tileSize': 256,
        'minzoom': 5,
        'maxzoom': 16
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
            'visibility': 'visible',
        },
        'paint': {
            'fill-color': ["step", ["get", "color_flag"],'#F62837',1,'#333333',2,'#fff',3,'#333333',4,'#333333',5,'#F62837'],//#fb9a99,#555555,#E64238
            'fill-opacity': 0.8
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
    map.setSky({
        "sky-color": "#199EF3",
        "sky-horizon-blend": 0.7,
        "horizon-color": "#f0f8ff",
        "horizon-fog-blend": 0.8,
        "fog-color": "#2c7fb8",
        "fog-ground-blend": 0.9,
        "atmosphere-blend": ["interpolate",["linear"],["zoom"],0,1,12,0]
    });
    
    map.on('click', 'hexgrid-a', function (e) {
        // クイズモード中はポップアップを表示しない
        if (quizActive) {
            return;
        }
        
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

// クイズ機能
// クイズデータの読み込み
function loadStationData() {
    // ローディング表示
    document.getElementById('quiz-question').innerHTML = '<div class="quiz-loading"><div class="quiz-loading-spinner"></div>データを読み込み中...</div>';
    document.getElementById('quiz-result').innerHTML = '';
    
    fetch('./app/data/quiz_chiba.geojson')
        .then(response => response.json())
        .then(data => {
            quizData = data.features;
            console.log(`クイズデータ ${quizData.length} 件を読み込みました`);
        })
        .catch(error => {
            console.error('クイズデータの読み込みエラー:', error);
            document.getElementById('quiz-question').innerHTML = '<div class="quiz-loading">データの読み込みに失敗しました</div>';
        });
}

// クイズの生成
function generateQuiz() {
    if (quizData.length === 0) {
        console.error('クイズデータがありません');
        document.getElementById('quiz-question').innerHTML = '<div class="quiz-loading">クイズデータがありません</div>';
        return;
    }
    
    // 既存のマーカーをクリア
    clearQuizMarkers();
    
    // ランダムにクイズポイントを選択
    const correctIndex = Math.floor(Math.random() * quizData.length);
    const correctQuizPoint = quizData[correctIndex];
    
    // 問題を設定
    currentQuiz = {
        point: correctQuizPoint,
        answered: false
    };
    
    // 問題文を表示
    document.getElementById('quiz-question').textContent = 
        `${correctQuizPoint.properties.name}の場所はどこ？`;
    document.getElementById('quiz-result').textContent = '';
    document.getElementById('quiz-result').className = '';
    document.getElementById('quiz-next').style.display = 'none';
    
    // 不正解の選択肢を作成（異なる市町村から選択）
    const wrongOptions = [];
    const usedIndices = new Set([correctIndex]);
    const usedCities = new Set();
    
    // 正解の市町村を記録
    if (correctQuizPoint.properties.city) {
        usedCities.add(correctQuizPoint.properties.city);
    }
    
    // まずは異なる市町村から選択を試みる
    let attempts = 0;
    const maxAttempts = 100; // 無限ループ防止
    
    while (wrongOptions.length < 4 && attempts < maxAttempts) {
        attempts++;
        const randomIndex = Math.floor(Math.random() * quizData.length);
        const candidate = quizData[randomIndex];
        
        // 既に使用されているインデックスはスキップ
        if (usedIndices.has(randomIndex)) continue;
        
        // 市町村情報がある場合は、異なる市町村から選択
        if (candidate.properties.city) {
            // 異なる市町村を優先、ただし十分な数の市町村がない場合は同じ市町村も許容
            if (!usedCities.has(candidate.properties.city) || wrongOptions.length < 2) {
                wrongOptions.push(candidate);
                usedIndices.add(randomIndex);
                usedCities.add(candidate.properties.city);
            }
        } else {
            // 市町村情報がない場合はそのまま追加
            wrongOptions.push(candidate);
            usedIndices.add(randomIndex);
        }
    }
    
    // 必要な数の選択肢が集まらなかった場合、制約を緩めて追加
    while (wrongOptions.length < 4) {
        const randomIndex = Math.floor(Math.random() * quizData.length);
        if (!usedIndices.has(randomIndex)) {
            wrongOptions.push(quizData[randomIndex]);
            usedIndices.add(randomIndex);
        }
    }
    
    // 全ての選択肢をシャッフル
    const allOptions = [...wrongOptions, correctQuizPoint];
    for (let i = allOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    
    // マーカーを作成
    allOptions.forEach((quizPoint, index) => {
        const isCorrect = quizPoint === correctQuizPoint;
        const marker = new maplibregl.Marker({
            color: '#3498db',
            scale: 0.8
        })
        .setLngLat(quizPoint.geometry.coordinates)
        .addTo(map);
        
        // マーカーにクリックイベントを追加
        const markerElement = marker.getElement();
        markerElement.classList.add('quiz-marker');
        markerElement.addEventListener('click', () => handleMarkerClick(marker, isCorrect, quizPoint));
        
        quizMarkers.push(marker);
        if (isCorrect) correctMarker = marker;
    });
    
    // 地図の表示位置を調整
    // 元のコード（選択肢に基づいて表示範囲を調整）
    /*
    const bounds = new maplibregl.LngLatBounds();
    allOptions.forEach(quizPoint => {
        bounds.extend(quizPoint.geometry.coordinates);
    });
    
    map.fitBounds(bounds, { padding: 100 });
    */
    
    // 固定の座標とズームレベルで表示
    map.flyTo({
        center: [140.32, 35.7],
        zoom: 8,
        essential: true
    });
}

// マーカークリック時の処理
function handleMarkerClick(marker, isCorrect, quizPoint) {
    if (currentQuiz && !currentQuiz.answered) {
        currentQuiz.answered = true;
        totalQuizzes++; // 出題数をカウントアップ
        
        // クイズ履歴に記録
        const locationName = quizPoint.properties.name || quizPoint.properties.name_alias || '不明な場所';
        quizHistory.push({
            question: currentQuiz.point.properties.name || '不明な場所',
            answer: locationName,
            isCorrect: isCorrect,
            date: new Date()
        });
        
        const resultElement = document.getElementById('quiz-result');
        
        if (isCorrect) {
            // 正解数と連続正解数をカウントアップ
            correctAnswers++;
            consecutiveCorrect++;
            
            // 最高記録を更新
            if (consecutiveCorrect > bestRecord) {
                bestRecord = consecutiveCorrect;
            }
            
            // 連続正解数に応じたメッセージを表示
            const locationName = quizPoint.properties.name || '不明な場所';
            const searchQuery = encodeURIComponent(`千葉県 ${locationName}`);
            const googleLink = `<a href="https://www.google.com/search?q=${searchQuery}" target="_blank" class="quiz-info-link">詳しく調べる ↗</a>`;
            
            if (consecutiveCorrect >= 2) {
                resultElement.innerHTML = `正解！${consecutiveCorrect}問連続正解だよ。<div>${googleLink}</div>`;
            } else {
                resultElement.innerHTML = `正解！<div>${googleLink}</div>`;
            }
            resultElement.className = 'quiz-correct';
            
            // 緑色のマーカーに置き換え
            const index = quizMarkers.indexOf(marker);
            if (index !== -1) {
                marker.remove();
                const newMarker = new maplibregl.Marker({
                    color: '#2ecc71',
                    scale: 0.8
                })
                .setLngLat(quizPoint.geometry.coordinates)
                .addTo(map);
                quizMarkers[index] = newMarker;
            }
        } else {
            // 不正解の場合は連続正解数をリセット
            consecutiveCorrect = 0;
            
            // データ構造をデバッグ出力
            console.log('Quiz point object:', quizPoint);
            
            // 安全にプロパティにアクセス
            let locationName = '不明な場所';
            if (quizPoint && quizPoint.properties) {
                locationName = quizPoint.properties.name || quizPoint.properties.name_alias || '不明な場所';
            }
            
            // Google検索リンクを追加
            const searchQuery = encodeURIComponent(`千葉県 ${locationName}`);
            const googleLink = `<a href="https://www.google.com/search?q=${searchQuery}" target="_blank" class="quiz-info-link">詳しく調べる ↗</a>`;
            
            resultElement.innerHTML = `惜しい！そこは${locationName}だよ。<div>${googleLink}</div>`;
            resultElement.className = 'quiz-incorrect';
            
            // 不正解のマーカーを赤色に置き換え
            const index = quizMarkers.indexOf(marker);
            if (index !== -1) {
                marker.remove();
                const newMarker = new maplibregl.Marker({
                    color: '#7f8c8d',
                    scale: 0.8
                })
                .setLngLat(quizPoint.geometry.coordinates)
                .addTo(map);
                quizMarkers[index] = newMarker;
            }
            
            // 正解のマーカーを緑色に置き換え
            const correctIndex = quizMarkers.indexOf(correctMarker);
            if (correctIndex !== -1) {
                correctMarker.remove();
                const newCorrectMarker = new maplibregl.Marker({
                    color: '#2ecc71',
                    scale: 0.8
                })
                .setLngLat(currentQuiz.point.geometry.coordinates)
                .addTo(map);
                quizMarkers[correctIndex] = newCorrectMarker;
                correctMarker = newCorrectMarker;
            }
        }
        
        // 結果出力リンクを表示
        const resultLinkElement = document.getElementById('quiz-result-link');
        if (resultLinkElement) {
            resultLinkElement.style.display = 'inline-block';
        }
        
        // 次の問題ボタンを表示
        document.getElementById('quiz-next').style.display = 'block';
    }
}

// マーカーをクリア
function clearQuizMarkers() {
    quizMarkers.forEach(marker => marker.remove());
    quizMarkers = [];
    correctMarker = null;
}

// クイズモードの切り替え
function toggleQuizMode() {
    quizActive = !quizActive;
    
    if (quizActive) {
        // クイズモードをアクティブにする
        document.getElementById('b_quiz').style.backgroundColor = '#e67e22';
        document.getElementById('quiz-container').style.display = 'block';
        document.getElementById('description').style.display = 'none';
        document.getElementById('map-setting').style.display = 'none';
        document.getElementById('b_description').style.backgroundColor = '#fff';
        document.getElementById('b_description').style.color = '#333';
        document.getElementById('b_setting').style.backgroundColor = '#fff';
        document.getElementById('b_setting').style.color = '#333';
        
        // 検索ボックスを非表示にする
        const geocoderContainer = document.querySelector('.maplibregl-ctrl-geocoder');
        if (geocoderContainer) {
            geocoderContainer.style.display = 'none';
        }
        
        // 背景地図を非表示にする
        map.setLayoutProperty('basemap-OSM', 'visibility', 'none');
        map.setLayoutProperty('basemap-GSIphoto', 'visibility', 'none');
        map.setLayoutProperty('basemap-GSIblank', 'visibility', 'none');
        map.setLayoutProperty('basemap-GSIhillshade', 'visibility', 'none');
        // セレクトボックスの選択も更新
        document.getElementById('basemap-id').selectedIndex = 4; // 背景地図なしの選択肢
        
        // チーバくんの不透明度を100%に設定
        const sliderElement = document.getElementById('slider_color');
        if (sliderElement) {
            sliderElement.value = 10; // スライダーの値を10に設定
            document.getElementById('slider_cValue').textContent = '100%';
            map.setPaintProperty('hexgrid-a', 'fill-opacity', 1.0);
        }
        
        // ローディング表示を初期表示
        document.getElementById('quiz-question').innerHTML = '<div class="quiz-loading"><div class="quiz-loading-spinner"></div>クイズを準備中...</div>';
        document.getElementById('quiz-result').innerHTML = '';
        
        // クイズデータがなければ読み込む
        if (quizData.length === 0) {
            loadStationData();
            // データ読み込み後に少し待ってからクイズを生成
            setTimeout(generateQuiz, 1500);
        } else {
            // データがある場合も少し待つことでローディングアニメーションを見せる
            setTimeout(generateQuiz, 800);
        }
    } else {
        // クイズモードを終了
        document.getElementById('b_quiz').style.backgroundColor = '#f39c12';
        document.getElementById('quiz-container').style.display = 'none';
        clearQuizMarkers();
        
        // 検索ボックスを再表示する
        const geocoderContainer = document.querySelector('.maplibregl-ctrl-geocoder');
        if (geocoderContainer) {
            geocoderContainer.style.display = 'block';
        }
    }
}

// クイズボタンのイベントリスナー
document.getElementById('b_quiz').addEventListener('click', function() {
    toggleQuizMode();
});

// 次の問題ボタンのイベントリスナー
document.getElementById('quiz-next').addEventListener('click', function() {
    generateQuiz();
});

// クイズ結果モーダルを表示
// クイズ履歴をリセットする関数
function resetQuizHistory() {
    quizHistory = [];
    totalQuizzes = 0;
    correctAnswers = 0;
    consecutiveCorrect = 0;
    bestRecord = 0;
    
    // モーダルを閉じる
    hideQuizResults();
}

function showQuizResults() {
    // 結果概要の生成
    const summaryElement = document.getElementById('quiz-summary');
    const correctRate = totalQuizzes > 0 ? Math.round((correctAnswers / totalQuizzes) * 100) : 0;
    
    let summaryHTML = `
        <p>出題数: <span class="highlight">${totalQuizzes}</span> 問</p>
        <p>正解数: <span class="highlight">${correctAnswers}</span> 問</p>
        <p>正答率: <span class="highlight">${correctRate}%</span></p>
        <p>最高連続正解数: <span class="highlight">${bestRecord}</span> 問</p>
        <button id="reset-quiz-history" class="quiz-reset-button">クイズ履歴をリセット</button>
    `;
    
    summaryElement.innerHTML = summaryHTML;
    
    // リセットボタンのイベントリスナーを追加
    const resetButton = document.getElementById('reset-quiz-history');
    if (resetButton) {
        // 既存のイベントリスナーを削除してから追加
        resetButton.removeEventListener('click', resetQuizHistory);
        resetButton.addEventListener('click', resetQuizHistory);
    }
    
    // 履歴リストの生成
    const historyListElement = document.getElementById('quiz-history-list');
    historyListElement.innerHTML = '';
    
    // 最新の履歴から表示
    const reversedHistory = [...quizHistory].reverse();
    
    reversedHistory.forEach((item, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'quiz-history-item';
        
        const questionSpan = document.createElement('span');
        questionSpan.textContent = `${item.question}`;
        
        const resultSpan = document.createElement('span');
        if (item.isCorrect) {
            resultSpan.className = 'correct';
            resultSpan.textContent = '○ 正解';
        } else {
            resultSpan.className = 'incorrect';
            resultSpan.textContent = '✕ 不正解 (' + item.answer + ')';
        }
        
        listItem.appendChild(questionSpan);
        listItem.appendChild(resultSpan);
        historyListElement.appendChild(listItem);
    });
    
    // モーダルを表示
    document.getElementById('quiz-modal').style.display = 'block';
}

// クイズ結果モーダルを非表示
function hideQuizResults() {
    document.getElementById('quiz-modal').style.display = 'none';
}

// クイズモードの初期化とイベントリスナーの設定
function initQuizEvents() {
    // 結果出力リンクのイベントリスナー
    const resultLinkElement = document.getElementById('quiz-result-link');
    if (resultLinkElement) {
        resultLinkElement.removeEventListener('click', showQuizResults); // 重複防止
        resultLinkElement.addEventListener('click', showQuizResults);
    }
    
    // モーダルの閉じるボタンのイベントリスナー
    const closeButton = document.querySelector('.quiz-modal-close');
    if (closeButton) {
        closeButton.removeEventListener('click', hideQuizResults); // 重複防止
        closeButton.addEventListener('click', hideQuizResults);
    }
}

// ページ読み込み完了時にイベントリスナーを設定
document.addEventListener('DOMContentLoaded', function() {
    initQuizEvents();
    
    // モーダルの外側をクリックしたときに閉じる
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('quiz-modal');
        if (event.target === modal) {
            hideQuizResults();
        }
    });
});

// 万一、ページが既に読み込まれている場合のフォールバック
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(initQuizEvents, 100);
}
