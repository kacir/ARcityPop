function runMain() {
       
	//globalish object which contains attributes referenced by multiple event bound functions.
	//is essential for keeping track of the current step in sequence
    var settings = {
        animationPlaying : false,
        currentYearIndex : 0,
        currentFeild : "pop10_11",
        fieldList : ["pop10_11" , "pop11_12" , "pop12_13" , "pop13_14" , "pop14_15" , "pop15_16" , "pop16_17"],
        fieldLabel : ["2010 - 2011" , "2011 - 2012" , "2012 - 2013" , "2013 - 2014" , "2014 - 2015" , "2015 - 2016" , "2016 - 2017"]
        
    };
    
    //returns style object for the feature given a particular population value
    function animationStyle (feature) {
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
            if (feature.properties[settings.currentFeild] > 0) {
                style.color = "#006400";
                style.fillColor = "#006400";
            } else {
                style.color = "#ff4500";
                style.fillColor = "#ff4500";
            }
            

            style.radius = Math.abs(feature.properties[settings.currentFeild]) * 225 * scaleFactor;
        }
        return style;
    }
    
    
    var map = L.map('map', {minZoom : 7}).fitWorld();
    var jsonLayer = L.geoJSON(null, {onEachFeature : bindFeaturePopup, style : animationStyle,
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
    map.on('zoomstart zoom zoomend', function () {jsonLayer.setStyle(animationStyle);})


    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, <a href="https://www.census.gov/">US Census Bureau</a>, <a href="https://gis.arkansas.gov/">Arkansas State GIS Office</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        maxZoom: 18

    }).addTo(map);


    
    //defining function that will add data into the json layer after the layer has been formed
    function addJSONToMap(response) {
        jsonLayer.addData(JSON.parse(response));
        map.fitBounds(jsonLayer.getBounds());//zoom to maxium extent of layer which is Arkansas
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
    jsonLayer.setStyle(animationStyle);
	
	
	
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
    
    
	
    
    //define function which changes animation advancement
    function moveAnimation (increment) {
		//advance the counter
        console.log("moving animation");
        settings.currentYearIndex += increment;
        if (settings.currentYearIndex === -1) {settings.currentYearIndex = settings.fieldList.length - 1;}
        if (settings.currentYearIndex > settings.fieldList.length -1) {settings.currentYearIndex = 0;}
        console.log("current year index is " + settings.currentYearIndex);
        
		//reset some of the values accordingly
        settings.currentYear = settings.fieldList[settings.currentYearIndex];
		console.log("the current year is " + settings.currentYear);
        settings.currentFeild = settings.fieldList[settings.currentYearIndex];
		console.log("the current field is " + settings.currentFeild);
        
		//perform changes to the UI @
        var slider = $("#slider");
        slider.val(settings.currentYearIndex).change();
        slider.attr("value", settings.currentYearIndex);
        slider.val(settings.currentYearIndex).change();
        yearControl._div.innerHTML = "Year : " + settings.fieldLabel[settings.currentYearIndex];
        console.log("slider value changed");
        
        
        jsonLayer.setStyle(animationStyle);
    }
    
	//define and bind function to play button to change the img and variable which determine if animation runs
    $("#playButton").click(function() {
        if (settings.animationPlaying === true) {
            settings.animationPlaying = false;
            this.innerHTML = '<img width="10" src="img/play.png"/>';
        } else {
            settings.animationPlaying = true;
            this.innerHTML = "Pause";
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
        settings.animationPlaying = false;
        moveAnimation(1);
    });
    $("#backButton").click(function(){
        settings.animationPlaying = false;
        moveAnimation(-1);
    });
    
    
    //add event to slider so it can move the animation forward @
    $("#slider").on("input", function (e){
        console.log("change slider event fired");
        var sliderValue = Number(this.value);
        console.log(sliderValue);
        if (sliderValue != settings.currentYearIndex) {
            
            settings.currentYearIndex = sliderValue;
            console.log("year index does not match, changing now");
            settings.currentYear = settings.fieldList[settings.currentYearIndex];
            settings.currentFeild = settings.fieldList[settings.currentYearIndex];
            yearControl._div.innerHTML = "Year : " + settings.fieldLabel[settings.currentYearIndex];
            jsonLayer.setStyle(animationStyle);

        } else {
            console.log("value does not differ!");
            console.log(sliderValue);
            console.log(settings.currentYearIndex);
        }
        
        
    });
    
    
}

//steps missing
//need to write function that varies symbology my population
//need to add control buttons

window.onload = runMain()