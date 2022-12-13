import * as maplibregl from "maplibre-gl";
import 'maplibre-gl/dist/maplibre-gl.css';
import './style.css';

const init_coord = [140.1992, 35.4895];
const init_zoom = 8;
const init_bearing = 0;
const init_pitch = 0;

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://tile2.openstreetmap.jp/styles/osm-bright-ja/style.json',
    center: init_coord,
    interactive: true,
    zoom: init_zoom,
    minZoom: 5,
    maxZoom: 21,
    maxBounds: [[110.0000, 25.0000],[170.0000, 50.0000]],
    bearing: init_bearing,
    pitch: init_pitch,
    attributionControl:false
    });

const swatches = document.getElementById('swatches');
const layer = document.getElementById('layer');
const colors = [
    'transparent', '#90ee90', '#32cd32', '#00bfff', '#1e90ff',
    '#fed976', '#fb9a99', '#ee82ee', '#f03b20', '#555555'
    ];
     
colors.forEach(function (color) {
    const swatch = document.createElement('button');
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', function () {
    map.setPaintProperty(layer.value, 'fill-color', color);
    });
    swatches.appendChild(swatch);
});

map.on('load', function () {
    map.addSource('chibakun', {
        'type': 'vector',
        'tiles': [location.href+"/app/data/zxy/{z}/{x}/{y}.pbf"],
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
        'id': 'hexgrid-a',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'layout': {
            },
            'paint': {
                'fill-color': 'transparent',
            }
    });
    map.addLayer({
        'id': 'hexgrid-0',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'filter': ['==', 'color_flag', 0],
        'layout': {
            },
            'paint': {
                'fill-color': '#fb9a99',
                'fill-opacity': 0.8,
            }
    });
    map.addLayer({
        'id': 'hexgrid-1',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'filter': ['==', 'color_flag', 1],
        'layout': {
            },
            'paint': {
                'fill-color': '#555555',
                'fill-opacity': 0.8,
            }
    });
    map.addLayer({
        'id': 'hexgrid-2',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'filter': ['==', 'color_flag', 2],
        'layout': {
            },
            'paint': {
                'fill-color': 'transparent',
                //'fill-opacity': 0.8,
            }
    });
    map.addLayer({
        'id': 'hexgrid-3',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'filter': ['==', 'color_flag', 3],
        'layout': {
            },
            'paint': {
                'fill-color': '#555555',
                'fill-opacity': 0.8,
            }
    });
    map.addLayer({
        'id': 'hexgrid-4',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'filter': ['==', 'color_flag', 4],
        'layout': {
            },
            'paint': {
                'fill-color': '#555555',
                'fill-opacity': 0.8,
            }
    });
    map.addLayer({
        'id': 'hexgrid-5',
        'type': 'fill',
        'source': 'chibakun',
        'source-layer': 'grid_chibakun',
        'filter': ['==', 'color_flag', 5],
        'layout': {
            },
            'paint': {
                'fill-color': '#fb9a99',
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
            'text-anchor': 'top',
            'text-allow-overlap': true,
            'text-size': 11,
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
            'symbol-sort-key': ['get', 'oid'],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-size': 10,
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
});

document.getElementById('b_legend').style.backgroundColor = "#fff";
document.getElementById('b_legend').style.color = "#555";

document.getElementById('b_cities').style.backgroundColor = "#fff";
document.getElementById('b_cities').style.color = "#555";

document.getElementById('b_railways').style.backgroundColor = "#fff";
document.getElementById('b_railways').style.color = "#555";

document.getElementById('b_location').style.backgroundColor = "#2c7fb8";
document.getElementById('b_location').style.color = "#fff";

document.getElementById('legend').style.display ="none";

document.getElementById('b_legend').addEventListener('click', function () {
    const visibility = document.getElementById('legend');
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

document.getElementById('b_cities').addEventListener('click', function () {
    const visibility = map.getLayoutProperty('cityarea', 'visibility');
    if (visibility === 'visible') {
        map.setLayoutProperty('cityarea', 'visibility', 'none');
        map.setLayoutProperty('admin-city', 'visibility', 'none');
        this.style.backgroundColor = "#fff";
        this.style.color = "#555"
    }
    else {
        map.setLayoutProperty('cityarea', 'visibility', 'visible');
        map.setLayoutProperty('admin-city', 'visibility', 'visible');
        this.style.backgroundColor = "#2c7fb8";
        this.style.color = "#fff";
    }
});

document.getElementById('b_railways').addEventListener('click', function () {
    const visibility1 = map.getLayoutProperty('railway1', 'visibility');
    if (visibility1 === 'visible') {
        map.setLayoutProperty('railway1', 'visibility', 'none');
        map.setLayoutProperty('railway2', 'visibility', 'none');
        map.setLayoutProperty('station', 'visibility', 'none');
        this.style.backgroundColor = "#fff";
        this.style.color = "#555"
    }
    else {
        map.setLayoutProperty('railway1', 'visibility', 'visible');
        map.setLayoutProperty('railway2', 'visibility', 'visible');
        map.setLayoutProperty('station', 'visibility', 'visible');
        this.style.backgroundColor = "#2c7fb8";
        this.style.color = "#fff";
    }
});

const loc_options = {
    enableHighAccuracy: false,
    timeout: 5000,
    maximumAge: 0
};

document.getElementById('icon-loader').style.display = 'none';

let popup_loc = new maplibregl.Popup({anchor:"bottom", focusAfterOpen:false});
let marker_loc = new maplibregl.Marker();

document.getElementById('b_location').addEventListener('click', function () {
    this.setAttribute("disabled", true);
    this.style.backgroundColor = "#fff";
    this.style.color = "#555"
    document.getElementById('icon-loader').style.display = 'block';
    navigator.geolocation.getCurrentPosition(
        (position) => {
            marker_loc.remove();
            popup_loc.remove();
            document.getElementById('icon-loader').style.display = 'none';
            this.removeAttribute("disabled");
            this.style.backgroundColor = "#2c7fb8";
            this.style.color = "#fff";

            let c_lat = position.coords.latitude;
            let c_lng = position.coords.longitude;
            
            map.jumpTo({
                center: [c_lng, c_lat],
                zoom: init_zoom + 1,
            });
            
            popup_loc.setLngLat([c_lng, c_lat]).setHTML('<p class="tipstyle02">ここだよ！</p>').addTo(map);
            marker_loc.setLngLat([c_lng, c_lat]).addTo(map);
        },
        (error) => {
            popup_loc.remove();
            document.getElementById('icon-loader').style.display = 'none';
            this.style.backgroundColor = "#999";
            this.style.color = "#fff"
            console.warn(`ERROR(${error.code}): ${error.message}`)
            map.flyTo({
                center: init_coord,
                zoom: init_zoom,
                speed: 1,
            });
            popup_loc.setLngLat(init_coord).setHTML('現在地が取得できませんでした').addTo(map);
        },
        loc_options
    );
});

const attCntl = new maplibregl.AttributionControl({
    customAttribution: '当コンテンツは国土交通省の<a href="https://nlftp.mlit.go.jp/cgi-bin/isj/dls/_choose_method.cgi">位置参照情報</a>・<a href="https://nlftp.mlit.go.jp/ksj/">国土数値情報</a>、及び<a href="https://www.pref.chiba.lg.jp/index.html">千葉県</a>の情報を作成者が独自に加工したものです。(<a href="https://twitter.com/Smille_feuille"> Twitter</a> | <a href="https://github.com/sanskruthiya/chibakun-map">Github</a> )',
    compact: true
});

map.addControl(attCntl, 'bottom-right');
