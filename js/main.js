function runMain() {
    
	//variable contains starter style options for the default layer style before the sequence styles are applied
    var geojsonMarkerOptions = {
        radius: 8,
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    
	//globalish object which contains attributes referenced by multiple event bound functions.
	//is essential for keeping track of the current step in sequence
    var settings = {
        animationPlaying : false,
        currentYear : 2010
    };
    
    //returns style object for the feature given a particular population value
    function animationStyle (feature) {
        var style = {
            fillColor: "#ff7800",
            color: "#000",
            fillOpacity : 0.5,
            opacity : 0.8
        };
        
        //switch statement for each of the individual cases
        switch (true) {
            case feature.properties["pop" + settings.currentYear] < 300:
                style.radius = 1;
                style.fillOpacity = 0.2;
                style.opacity = 0.2;
                break;
            case feature.properties["pop" + settings.currentYear] < 1600:
                style.radius = 3;
                style.fillOpacity = 0.3;
                style.opacity = 0.3;
                break;
            case feature.properties["pop" + settings.currentYear] < 8000:
                style.radius = 5;
                style.fillOpacity = 0.4;
                style.opacity = 0.4;
                break;
            case feature.properties["pop" + settings.currentYear] < 40000:
                style.radius = 7;
                style.fillOpacity = 0.6;
                style.opacity = 0.6;
                break;
            case feature.properties["pop" + settings.currentYear] > 40000:
                style.radius = 9;
                style.fillOpacity = 0.8;
                style.opacity = 0.8;
                break;
            default:
                console.log("failed to place in catagory");
                break;
        }
        
        style.radius = Math.sqrt(feature.properties["pop" + settings.currentYear] * 0.02 / Math.PI);
        
        return style;
    }
    
    
    var map = L.map('map').fitWorld();
    var jsonLayer = L.geoJSON(null, {onEachFeature : bindFeaturePopup, style : animationStyle,
        pointToLayer : function (feature, latlng) {
            return L.circleMarker(latlng, geojsonMarkerOptions)
            }
        }).addTo(map);//json layer that stores all of the raw point data

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, <a href="https://www.census.gov/">US Census Bureau</a>, <a href="https://gis.arkansas.gov/">Arkansas State GIS Office</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18 ,
        id: 'mapbox.streets',
        accessToken : 'pk.eyJ1Ijoia2FjaXIiLCJhIjoiY2l4eHlnZzVnMDA0bjJxcGl5aTVsempmayJ9.lsLs8ZMU2chV2SOil7yMRQ'
    }).addTo(map);

    
    //defining function that will be the callbackfunction to add gson data into the map
    function addJSONToMap(response) {
        jsonLayer.addData(JSON.parse(response));
        map.fitBounds(jsonLayer.getBounds());//zoom to maxium extent of layer which is Arkansas
    }
    
    
    function bindFeaturePopup (feature, layer) {
        var popupText;
        
        popupText = "<h3>" + feature.properties.city_name + "</h3>" +
            "<table>" + 
            "<tr><th>Year</th> <th>Population</th></tr>" +
            "<tr><td>2010</td> <td>" + feature.properties.pop2010.toLocaleString() + "</tr>" + 
            "<tr><td>2011</td> <td>" + feature.properties.pop2011.toLocaleString() + "</tr>" + 
            "<tr><td>2012</td> <td>" + feature.properties.pop2012.toLocaleString() + "</tr>" + 
            "<tr><td>2013</td> <td>" + feature.properties.pop2013.toLocaleString() + "</tr>" + 
            "<tr><td>2014</td> <td>" + feature.properties.pop2014.toLocaleString() + "</tr>" + 
            "<tr><td>2015</td> <td>" + feature.properties.pop2015.toLocaleString() + "</tr>" + 
            "<tr><td>2016</td> <td>" + feature.properties.pop2016.toLocaleString() + "</tr>" + 
            "<tr><td>2017</td> <td>" + feature.properties.pop2017.toLocaleString() + "</tr>" + 
            
            "</table>";
        
        layer.bindPopup(popupText);
    }
    
    
    $.ajax("data/CITY.geojson" , {
        datatype : "json",
        success: addJSONToMap
        }).fail(function() {alert("Unable to load data")});
    
    var yearControl = L.control();

    yearControl.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'yearControl'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    yearControl.update = function (props) {

        this._div.innerHTML =  'Year: 2010';
        this._div.style = "background-color : white; padding : 3px;"
    };

    yearControl.addTo(map);
    
    
    //define and bind function to play button to change the img and variable which determine if animation runs
    $("#playButton").click(function() {
        if (settings.animationPlaying === true) {
            settings.animationPlaying = false;
            this.innerHTML = "Play";
        } else {
            settings.animationPlaying = true;
            this.innerHTML = "Pause";
        }
    });
    
    //bind function which launches animation over time
    setInterval( function () {
        if (settings.animationPlaying){
            console.log("second");
            settings.currentYear += 1;
            if (settings.currentYear === 2018) {settings.currentYear = 2010;}
            yearControl._div.innerHTML = "Year: " + settings.currentYear;
            $("#slider").attr("value" , settings.currentYear);

            jsonLayer.setStyle(animationStyle);
        }
    } , 1000);
    
    //bind function which steps animation over one step at a time
    $("#forwardButton").click(function(){
        settings.currentYear += 1;
        if (settings.currentYear === 2018) {settings.currentYear = 2010;}
        yearControl._div.innerHTML = "Year: " + settings.currentYear;
        $("#slider").attr("value" , settings.currentYear);

        jsonLayer.setStyle(animationStyle);
    });
    
    $("#backButton").click(function(){
        settings.currentYear -= 1;
        if (settings.currentYear === 2009) {settings.currentYear = 2017;}
        yearControl._div.innerHTML = "Year: " + settings.currentYear;
        $("#slider").attr("value" , settings.currentYear);
        
        jsonLayer.setStyle(animationStyle);
    })
    
    
}

//steps missing
//need to write function that varies symbology my population
//need to add control buttons

window.onload = runMain()