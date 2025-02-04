// Store API endpoint as queryURL
let queryURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson"

// Perform GET request to the query URL
d3.json(queryURL).then(function (data) {
    // print response to console
    console.log(data)
    // pass the data.features object to the createFeatures function.
    createFeatures(data.features)
});

// Define createFeatures function to run once for each feature in the array
function createFeatures(earthquakeData) {
    function onEachFeature(feature, layer) {
        
        // Give each feature a popup that provides details of the earthquake.
        let date = new Date(feature.properties.time)
        layer.bindPopup(`<h3>${date}</h3>
        <br><b>Location:</b> ${feature.properties.place}
        <br><b>Magnitude:</b> ${feature.properties.mag}
        <br><b>Depth:</b> ${feature.geometry.coordinates[2]}`);
    }
    
    // Create a GeoJSON layer that contains the features array on the earthquakeData object.
    // Run the onEachFeature function once for each piece of data in the array.
    let earthquakes = L.geoJSON(earthquakeData, {
        onEachFeature: onEachFeature,
        pointToLayer: function(feature, latlng) {
            // Store magnitude, dpeth into variables
            let magnitude = feature.properties.mag;
            let depth = feature.geometry.coordinates[2]

            // Customize the markers
            let geojsonMarkerOptions = {
                color: "black",
                fillColor: markerColor(depth), //utiilze markerColor function, defined in line 172
                fillOpacity: 1,
                radius: magnitude * 4, // size of marker is dependent on magnitude
                weight: 1
            }
            return L.circleMarker(latlng, geojsonMarkerOptions)
        }
    });

    // Send our earthquakes layer to the createMap function
    createMap(earthquakes);
};

// Define createMap function
function createMap(earthquakes) {

    // Create the base layers.
    let topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
    });

    // Grayscale TileLayer for Leaflet, written by Ilya Zverev
    // Source code: https://github.com/Zverik/leaflet-grayscale
    L.TileLayer.Grayscale = L.TileLayer.extend({
        options: {
            quotaRed: 21,
            quotaGreen: 71,
            quotaBlue: 8,
            quotaDividerTune: 0,
            quotaDivider: function() {
                return this.quotaRed + this.quotaGreen + this.quotaBlue + this.quotaDividerTune;
            }
        },
    
        initialize: function (url, options) {
            options = options || {}
            options.crossOrigin = true;
            L.TileLayer.prototype.initialize.call(this, url, options);
    
            this.on('tileload', function(e) {
                this._makeGrayscale(e.tile);
            });
        },
    
        _createTile: function () {
            var tile = L.TileLayer.prototype._createTile.call(this);
            tile.crossOrigin = "Anonymous";
            return tile;
        },
    
        _makeGrayscale: function (img) {
            if (img.getAttribute('data-grayscaled'))
                return;
    
                    img.crossOrigin = '';
            var canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
    
            var imgd = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var pix = imgd.data;
            for (var i = 0, n = pix.length; i < n; i += 4) {
                            pix[i] = pix[i + 1] = pix[i + 2] = (this.options.quotaRed * pix[i] + this.options.quotaGreen * pix[i + 1] + this.options.quotaBlue * pix[i + 2]) / this.options.quotaDivider();
            }
            ctx.putImageData(imgd, 0, 0);
            img.setAttribute('data-grayscaled', true);
            img.src = canvas.toDataURL();
        }
    });
    
    L.tileLayer.grayscale = function (url, options) {
        return new L.TileLayer.Grayscale(url, options);
    };

    // Now that the script for grayscale was added, add grayscale layer
    let grayscale = L.tileLayer.grayscale('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    });

    // Create a baseMaps object
    let baseMaps = {
        // "Street Map": street,
        "Topographic Map": topo,
        "Grayscale Streetmap": grayscale
    };

    // Create an overlay object
    let overlayMaps = {
        Earthquakes: earthquakes
    };

    // Create our map, giving it the grayscale and earthquakes layers to display on load.
    let myMap = L.map("map", {
        center: [38.784182275648625, -98.89379612121208],
        zoom: 5,
        layers: [grayscale,earthquakes]
    });

    // Create a layer control.
    // Pass it our baseMaps and overlayMaps.
    // Add the layer control to the map.
    L.control.layers(baseMaps, overlayMaps, {
        collapsed: false
      }).addTo(myMap);

    // Set up the legend
    let legend = L.control({ position: "bottomright" });
    legend.onAdd = function() {
      let div = L.DomUtil.create("div", "info legend");
      let categories = ['< 10', '10 - 30', '30 - 50', '50 - 70', '70 - 90', '90+'];
      let colors = ['#a3f600','#dcf400','#f7db11','#fdb72a','#fca35d', '#ff5f65'];
      let labels = [];
  
      // Title element of the legend
      div.innerHTML = "<h3>Depth (km)</strong> <h3>"

      // Loop through categories array 
      for (let i = 0; i < categories.length; i++) {

        // Use div.innerHTML += to add text elements into the div containing the legend using categories/colors arrays
        div.innerHTML += 
        '<li style="background-color:' + colors[i] + '"</li>';
        div.innerHTML += ' ' + categories[i]
        div.innerHTML += '<br>'
      };

      return div;
    };
  
    // Add the legend to the map
    legend.addTo(myMap);
};

// define function to determine marker color
function markerColor(depth) {
    // Blank variable to hold color
    let color = ''

    // conditional to determine color based on depth value
    if (depth <= 10) {
        return color = '#a3f600';
    } else if (depth <= 30) {
        return color = '#dcf400';
    } else if (depth <= 50) {
        return color = '#f7db11';
    } else if (depth <= 70) {
        return color = '#fdb72a';
    } else if (depth <= 90) {
        return color = '#fca35d';
    } else {
        return color = '#ff5f65'
    }
};