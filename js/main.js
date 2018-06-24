function runMain() {
       
	//globalish object which contains attributes referenced by multiple event bound functions.
	//is essential for keeping track of the current step in sequence
    var settings = {
        animationPlaying : false,
        currentYearIndex : 0,
        currentFeild : "pop10_11",
        fieldList : ["pop10_11" , "pop11_12" , "pop12_13" , "pop13_14" , "pop14_15" , "pop15_16" , "pop16_17"],
        fieldLabel : ["2010" , "2011" , "2012" , "2013" , "2014" , "2015" , "2016"]
        
    };
    
    //generates style object for city layer
    function animationStyleCity (feature) {
        var style = {
            fillColor: "#ff7800",
            color: "#000",
            fillOpacity : 0.5,
            opacity : 0.8
        };
        
        //create a factor to increase symbol size as you are zooming in
        var scaleFactor = map.getZoom() - 6;
        
        //set the color according to if the % is negitive positive or zero
        if (feature.properties[settings.currentFeild] == 0) {
            style.color = "#2F4F4F";
            style.fillColor = "#2F4F4F";
            style.radius = 1 * scaleFactor;
        } else {
            //set color to green if the more than 1
            if (feature.properties[settings.currentFeild] > 0) {
                style.color = "#006400";
                style.fillColor = "#006400";
            } else {
                style.color = "red";
                style.fillColor = "red";
            }
            

            style.radius = Math.abs(feature.properties[settings.currentFeild]) * 225 * scaleFactor;
        }
        return style;
    }
    
    //generates style object for county layer
    function animationStyleCounty (feature) {
        var style = { };
        
        //try and use opacity the first time to set growth information
        
        
        return style;
    }
    
    

    //load a bounding box dataset which decides the maximum panning of the map.
    var mapOuterBounds = "placeholder";
    $.ajax("data/BoundingBox.geojson" , {
        datatype : "json",
        success: function (response){
            console.log("starting to make bounds");
            mapOuterBounds = L.geoJSON(JSON.parse(response)).getBounds();
            console.log("bounds have been made");
        }
    }).fail(function() {alert("Unable to load bouding data");});
    
    //define layers that will be shown in the map
    var counties = L.geoJSON(null);
    $.ajax("data/COUNTIES.geojson" , {
        datatype : "json",
        success : function (response) {
            console.log("making Counties");
            counties.addData(JSON.parse(response));
        }
    }).fail(function() {alert("unable to load counties data")});
    
    
                       
    //create the map object that will display everything                   
    var map = L.map('map', {minZoom : 6 , maxZoom : 12 }).fitWorld();
    
    //add a legend control the map
    L.control.layers(null, {"County" : counties}).addTo(map);
    
    var cityLayer = L.geoJSON(null, {onEachFeature : bindFeaturePopup, style : animationStyleCity,
        pointToLayer : function (feature, latlng) {
            return L.circleMarker(latlng, {
				radius: 8,
				fillColor: "#ff7800",
				color: "#000",
				weight: 1,
				opacity: 1,
				fillOpacity: 0.8
				})
            }
        }).addTo(map);//json layer that stores all of the raw point data
    map.on('zoomstart zoom zoomend', function () {cityLayer.setStyle(animationStyleCity);})

    //add a basemap to the map basemap is dark
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Data from <a href="https://www.openstreetmap.org/">Open Street Maps</a>, <a href="https://gis.arkansas.gov/">Arkansas State GIS Office</a>, <a href="http://www.arkansashighways.com/">Arkansas Department of Transporation</a>, and the <a href="https://www.census.gov/">US Census Bureau</a>. Basemap provided by <a/ href="https://carto.com/">CartoDB<a>',
        maxZoom: 18
        
    }).addTo(map);
    

    
    //prevents the map from zoomout outside of the maximum extent
    map.on('drag', function() {
        map.panInsideBounds(mapOuterBounds, { animate: false });
        });

    
    //defining function that will add data into the json layer after the layer has been formed
    function addJSONToMap(response) {
        cityLayer.addData(JSON.parse(response));
        map.fitBounds(cityLayer.getBounds());//zoom to maxium extent of layer which is Arkansas
    }
    
    
    
    //function is tied to the option object for the json layer created. function adds popups to each of the features
    function bindFeaturePopup (feature, layer) {
        var popupText;
        
        popupText = "<h3>" + feature.properties.city_name + "</h3>" +
            "<table>" + 
            "<tr><th>Year</th> <th>Population</th></tr>" +
            "<tr><td>2010 - 2011</td> <td>" + Math.round(feature.properties.pop10_11 * 100) + "%</tr>" + 
            "<tr><td>2011 - 2012</td> <td>" + Math.round(feature.properties.pop11_12 * 100) + "%</tr>" + 
            "<tr><td>2012 - 2013</td> <td>" + Math.round(feature.properties.pop12_13 * 100) + "%</tr>" + 
            "<tr><td>2013 - 2014</td> <td>" + Math.round(feature.properties.pop13_14 * 100) + "%</tr>" + 
            "<tr><td>2014 - 2015</td> <td>" + Math.round(feature.properties.pop14_15 * 100) + "%</tr>" + 
            "<tr><td>2015 - 2016</td> <td>" + Math.round(feature.properties.pop15_16 * 100) + "%</tr>" + 
            "<tr><td>2016 - 2017</td> <td>" + Math.round(feature.properties.pop16_17 * 100) + "%</tr>" + 
            "</table>";
        
        layer.bindPopup(popupText);
    }
    
    //gets the city data from ajax and calls the method to start chain of adding data to map
    $.ajax("data/CITY.geojson" , {
        datatype : "json",
        success: addJSONToMap
        }).fail(function() {alert("Unable to load data");});
    
    //reset symbology after zoom levels set correctly
    cityLayer.setStyle(animationStyleCity);
	
	
	
	//create a year label in the map
    var yearControl = L.control();
    yearControl.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'yearControl'); // create a div with a class "info"
        this.update();
        return this._div;
    };
    // method that we will use to update the control based on feature properties passed
    yearControl.update = function (props) {

        this._div.innerHTML =  'Year: 2010-2011';
        this._div.title = "The Current Year shown in map";
    };
    yearControl.addTo(map);
    
    
    //create a control for the legend
    var legendControl = L.control();
    legendControl.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'legend'); // create a div with a class "info"

        this.update();
        return this._div;
    };
    legendControl.update = function (props) {
        this._div.title = "Info Represents feature in map";
        this._div.innerHTML = "<h3>Legend</h3> <ul><li>Growing City<div class='circle' id='growing' /></li><li>Shrinking City <div class='circle' id='shrinking' /></li><li>No population change <div class='circle' id='nochange' /></li></ul><p>Note the larger the circle the larger the % change</p>";
    }
    legendControl.addTo(map);
    
    
	function disableButtonApply () {
        console.log("Disable Button function Triggered!");
        if (settings.currentYearIndex === 0){
            $("#backButton").attr("disabled" , "");
        } else {
            if ($("#backButton")[0].hasAttribute("disabled")) {
                $("#backButton").removeAttr("disabled");
            }
        }
        
        if (settings.currentYearIndex === settings.fieldList.length -1) {
            $("#forwardButton").attr("disabled" , "");
            $("#playButton img").attr("src", "img/replay.png").attr("width" , "12");
        } else {
            $("#playButton img").attr("src", "img/play.png").attr("width" , "10");
            if ($("#forwardButton")[0].hasAttribute("disabled")) {
                $("#forwardButton").removeAttr("disabled");
            }
        }
    }
    
    //define function which changes animation advancement
    function moveAnimation (increment) {
		//advance the counter
        console.log("moving animation");
        settings.currentYearIndex += increment;
        if (settings.currentYearIndex === -1) {settings.currentYearIndex = settings.fieldList.length - 1;}
        if (settings.currentYearIndex > settings.fieldList.length -1) {settings.currentYearIndex = 0;}
        
		//reset some of the values accordingly
        settings.currentYear = settings.fieldList[settings.currentYearIndex];
        settings.currentFeild = settings.fieldList[settings.currentYearIndex];
        
		//perform changes to the UI @
        var slider = $("#slider");
        slider.val(settings.currentYearIndex).change();
        slider.attr("value", settings.currentYearIndex);
        slider.val(settings.currentYearIndex).change();
        yearControl._div.innerHTML = "Year : " + settings.fieldLabel[settings.currentYearIndex];

        cityLayer.setStyle(animationStyleCity);
    }
    
	//define and bind function to play button to change the img and variable which determine if animation runs
    $("#playButton").click(function() {
        $("#clicksound")[0].play();
        if (settings.animationPlaying === true) {
            settings.animationPlaying = false;
            this.innerHTML = '<img width="10" src="img/play.png"/>';
        } else {
            settings.animationPlaying = true;
            this.innerHTML = "<img src='img/pause.png' width='12' />";
        }
    });
	
    //bind function which launches animation over time
    setInterval( function () {
        if (settings.animationPlaying){
            moveAnimation(1);
        }
    } , 1500);
    
    //bind function which steps animation over one step at a time
    $("#forwardButton").click(function(){
        if (!this.hasAttribute("disabled")) {
            $("#clicksound")[0].play();
            settings.animationPlaying = false;
            moveAnimation(1);
            disableButtonApply();
        }
    });
    $("#backButton").click(function(){
        if (!this.hasAttribute("disabled")) {
            $("#clicksound")[0].play();
            settings.animationPlaying = false;
            moveAnimation(-1);
            disableButtonApply();
        }
    });
    
    
    //add event to slider so it can move the animation forward @
    $("#slider").on("input", function (e){
        console.log("change slider event fired");
        var sliderValue = Number(this.value);
        console.log(sliderValue);
        if (sliderValue != settings.currentYearIndex) {
            
            settings.currentYearIndex = sliderValue;
            settings.currentYear = settings.fieldList[settings.currentYearIndex];
            settings.currentFeild = settings.fieldList[settings.currentYearIndex];
            yearControl._div.innerHTML = "Year : " + settings.fieldLabel[settings.currentYearIndex];
            cityLayer.setStyle(animationStyleCity);

        } else {
            console.log(sliderValue);
            console.log(settings.currentYearIndex);
        }
        disableButtonApply();
        
    });
    
    //make the animation move according to keystrokes
    document.addEventListener("keydown" , function(event) {
        switch (event.key){
            case "ArrowRight":
                $("#clicksound")[0].play();
                settings.animationPlaying = false;
                moveAnimation(1);
                disableButtonApply();
                event.preventDefault();
                break;
                
            case "ArrowLeft":
                $("#clicksound")[0].play();
                settings.animationPlaying = false;
                moveAnimation(-1);
                disableButtonApply();
                event.preventDefault();
                break;
        }
    })
    
}

//steps missing
//need to write function that varies symbology my population
//need to add control buttons

window.onload = runMain()