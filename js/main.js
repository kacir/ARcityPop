function runMain() {
       
	//globalish object which contains attributes and methods used to react to events in the DOM.
    var settings = {
        animationPlaying : false,//indicates if the play button is active so the animation can step forward overtime
        currentYearIndex : 0,//the index position in the list of the current point in time shown on map
        currentFieldCity : "pop10_11",//the field name inside of the cities layer that corresponds to the current year.
        currentFieldCounty : "perCh2010",//the field name inside of the counties layer that corresponds to the current year
        currentFieldCountyRaw : "income2010",
        fieldListCity : ["pop10_11" , "pop11_12" , "pop12_13" , "pop13_14" , "pop14_15" , "pop15_16" , "pop16_17"],//the field list of all relevent year related field in cities layer
        fieldListCounty : ["perCh2010" ,"perCh2011", "perCh2012", "perCh2013", "perCh2014", "perCh2015", "perCh2016"],
        fieldListCountyRaw : ["income2010", "income2011", "income2012", "income2013", "income2014", "income2015", "income2016"],
        fieldLabel : ["2010" , "2011" , "2012" , "2013" , "2014" , "2015" , "2016"],//list of year labels that will be shown to the user in the year div element.
        legendHTMLCity : "<h3>Legend</h3> <ul><li>Growing City<div class='circle' id='growing' /></li><li>Shrinking City <div class='circle' id='shrinking' /></li><li>No population change <div class='circle' id='nochange' /></li></ul><p>Note the larger the circle the larger the % change</p>",
        legendHTMLCounty : "Green Counties are Growing, Red Counties are Shrinking",
        
        //method changes the index for the current year shown in the map. This is a general method 
        //which takes care of ui and property related actions which all UI elements need to change
        //when the year changes for the map
        changeIndex :  function (index) {
            //method sets changes internal properties which change when the index year is changed
            settings.currentYearIndex = index;
            
            //tests to prevent index from going out of range
            if (settings.currentYearIndex === -1) {settings.currentYearIndex = settings.fieldListCity.length - 1;}
            if (settings.currentYearIndex > settings.fieldListCity.length -1) {settings.currentYearIndex = 0;}
            
            //makes it eaier to set the year information in the year div
            settings.currentFieldCity = settings.fieldListCity[index];
            settings.currentFieldCounty = settings.fieldListCounty[index];
            settings.currentFieldCountyRaw = settings.fieldListCountyRaw[index];
            settings.label = "Year: "+ settings.fieldLabel[index];
            
            //sets UI elements according to index status
            yearControl.html(settings.label);//changes the label shown in year div
            settings.disableButtons();//disable or enable certain buttons based on what the index is
            cityLayer.setStyle(animationStyleCity);//refresh the style of the map to reflect the current most year
            counties.setStyle(animationStyleCounty);
            settings.legendUpdate();
            
            //attempt to reset popups of counties layer
            counties.eachLayer(function(layer) {
                //there is no data for the last year. if the layer has a popup open close it because it will not refer to anything. there will be no polygon below the popup.
                if (settings.currentYearIndex == 6) {
                    layer.closePopup();
                    return settings;
                }
                settings.countyPopupTextConstruct(layer.feature, layer);
            });
            
            return settings;
        },
        //creates and binds popup text for the counties layer
        countyPopupTextConstruct : function(feature, layer) {
                var percentChange = feature.properties[settings.currentFieldCounty];
                var countyName = feature.properties["name"];
                var rawValue = feature.properties[settings.currentFieldCountyRaw];
            
                layer.bindPopup("<H3>" + countyName + "County: </H3> <p class='popupText'> " + percentChange + "% Change in income (originally $" + rawValue + ") </p>");
        },
        
        //disables or enables the back and forward buttons depend on if the current year is the last or first year
        disableButtons : function () {
            //if the index is 0 disable the button, otherwise leave it enabled
            console.log("Disable Button function Triggered!");
            if (settings.currentYearIndex === 0){
                $("#backButton").attr("disabled" , "");
            } else {
                if ($("#backButton")[0].hasAttribute("disabled")) {
                    $("#backButton").removeAttr("disabled");
                }
            }
            
            //if the last year is the current year disable the forward button and chase the playbutton into a replay button
            if (settings.currentYearIndex === settings.fieldListCity.length -1) {
                $("#forwardButton").attr("disabled" , "");
                settings.forcedPause();
                $("#playButton")[0].innerHTML = '<img width="10" src="img/replay.png">';
            } else {
                if ($("#forwardButton")[0].hasAttribute("disabled")) {
                    $("#forwardButton").removeAttr("disabled");
                }
                if (!settings.animationPlaying) {
                    $("#playButton")[0].innerHTML = '<img width="10" src="img/play.png">';
                }
            }
        },
        
        //plays a click sounds. used by several methods tied to buttons
        playSound :  function () {
            $("#clicksound")[0].play();
            return settings;
        },
        
        //whenever the animation moves via arrow keystrokes or arrow buttons the
        //slider needs to move too. This method changes the slider position to the
        //current year index
        moveSlider : function () {
            var slider = $("#slider");
            slider.val(settings.currentYearIndex).change();
            slider.attr("value", settings.currentYearIndex);
            slider.val(settings.currentYearIndex).change();
            yearControl.html("Year : " + settings.fieldLabel[settings.currentYearIndex]);
        },
        
        //method is tied to both forward button and arrow key forward. advances animation forward by one year
        advanceAnimationForward : function () {
            if (!$("#forwardButton")[0].hasAttribute("disabled")) {
                settings.playSound();
                settings.forcedPause();
                settings.changeIndex(settings.currentYearIndex + 1);
                settings.moveSlider();
            }
        },
        
        //mehtod is tied to both backward button and backward arrow key. adances the animation backward by one year
        advanceAnimationBackward : function () {
            if (!$("#backButton")[0].hasAttribute("disabled")) {
                settings.playSound();
                settings.forcedPause();
                settings.changeIndex(settings.currentYearIndex - 1);
                settings.moveSlider();
            }
        },
        
        //method is called when play button is pressed. It changes the animation status and changes the button icon
        //to reflect the most current state.
        playPause : function () {
            settings.playSound();
            if (settings.animationPlaying == true) {
                settings.animationPlaying = false;
                $("#playButton")[0].innerHTML = '<img width="10" src="img/play.png"/>';
            } else {
                settings.animationPlaying = true;
                $("#playButton")[0].innerHTML = "<img src='img/pause.png' width='12' />";
            }
        },
        
        //method called when backward or forward action is called. it prevents the playing animation to
        //advance automatically
        forcedPause : function () {
            settings.animationPlaying = false;
            $("#playButton")[0].innerHTML = '<img width="10" src="img/play.png"/>';
        },
        
        legendUpdate : function() {
            var legendHTML = "";
            
            if(map.hasLayer(cityLayer)) {
                legendHTML = legendHTML + settings.legendHTMLCity;
            }
            
            if (map.hasLayer(counties)) {
                if (settings.currentYearIndex == 6) {
                    legendHTML = legendHTML + "<p id='missingData'>Income data is not avaliable for this year</p>";
                } else {
                    legendHTML = legendHTML + settings.legendHTMLCounty;
                }
            }
            
            legendControl._div.innerHTML = legendHTML
            
        }
        
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
        if (feature.properties[settings.currentFieldCity] == 0) {
            style.color = "#2F4F4F";
            style.fillColor = "#2F4F4F";
            style.radius = 1 * scaleFactor;
        } else {
            //set color to green if the more than 1
            if (feature.properties[settings.currentFieldCity] > 0) {
                style.color = "#006400";
                style.fillColor = "#006400";
            } else {
                style.color = "red";
                style.fillColor = "red";
            }
            

            style.radius = Math.abs(feature.properties[settings.currentFieldCity]) * 225 * scaleFactor;
        }
        return style;
    }
    
    //generates style object for county layer
    function animationStyleCounty (feature) {
        var style = {
            fillColor : "#FFFF00",
            color: "#FFFF00",
            opacity : 0.95,
            fillOpacity : 1.0,
            color : "black"
        };
        
        if (settings.currentFieldCounty == 'perCh2016') {
            style.opacity = 0;
            style.fillColor = 'none';
            return style;
        }
        
        var percentChange = Number(feature.properties[settings.currentFieldCounty]);
        
        //counties with no population change get a value of zero
        if (percentChange == 0) {
            style.opacity = 0;
            style.fillColor = 'none';
        } else {
            if (percentChange > 0){
                style.fillColor = "green";
                
            } else {
                style.fillColor = "red";
                
            }
            
            
        }
        
        return style;
    }
    
    
    
    

    //load a bounding box dataset which decides the maximum panning area of the map.
    //it helps prevent the user from getting lost.
    var mapOuterBounds = "placeholder";
    $.ajax("data/BoundingBox.geojson" , {
        datatype : "json",
        success: function (response){
            console.log("starting to make bounds");
            mapOuterBounds = L.geoJSON(JSON.parse(response)).getBounds();
            console.log("bounds have been made");
        }
    }).fail(function() {alert("Unable to load bouding data");});
    
    //generate the layer object for the counties dataset
    var counties = L.geoJSON(null , 
            {style : animationStyleCounty, onEachFeature : settings.countyPopupTextConstruct}                       
        );
    
    //load the counties data into the counties layer
    $.ajax("data/COUNTIES.geojson" , {
        datatype : "json",
        success : function (response) {
            console.log("making Counties");
            counties.addData(JSON.parse(response));
        }
    }).fail(function() {alert("unable to load counties data")});
    
    
                       
    //create the map object that will display everything                   
    var map = L.map('map', {minZoom : 6 , maxZoom : 12 }).fitWorld();
    

    
    //generate an empty layer for the city data to sit in.
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
    
    //add a legend control the map
    L.control.layers(null, {"City Population Growth" : cityLayer , "County Income" : counties}).addTo(map);
    
    //whenever the map zooms the city layer symbology will be reset so the symbel actually get larger as the user zooms in
    map.on('zoomstart zoom zoomend', function () {cityLayer.setStyle(animationStyleCity);})

    //add a basemap to the map basemap is dark
    L.tileLayer('https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: 'Data from <a href="https://www.openstreetmap.org/">Open Street Maps</a>, <a href="https://gis.arkansas.gov/">Arkansas State GIS Office</a>, <a href="http://www.arkansashighways.com/">Arkansas Department of Transporation</a>, and the <a href="https://www.census.gov/">US Census Bureau</a>. Basemap provided by <a/ href="https://carto.com/">CartoDB<a>',
        maxZoom: 18
    }).addTo(map);
    

    
    //prevents the map from zooming outside of the maximum extent and getting lost
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
	
    
    
    
    
    
    
    
    
    
    
	
	
	//create a year label object which is used by many functions
    var yearControl = $(".yearControl");
    console.log(yearControl);
    
    
    //create a control for the legend
    var legendControl = L.control();
    legendControl.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'legend'); // create a div with a class "info"

        this.update();
        return this._div;
    };
    legendControl.update = function (props) {
        this._div.title = "Info Represents feature in map";
        this._div.innerHTML = settings.legendHTMLCity;
    }
    legendControl.addTo(map);
    
    
    
    
    
    
    
    //update the contents of the legend according to which layers are currently in the map
    $("input[type=checkbox]").bind("change", settings.legendUpdate);
    //whenever the layers are changed in the layer visibility, always make sure the cities layer ends up on top
    $("input[type=checkbox]").bind("change", function () {
                                    cityLayer.bringToFront();
                                    });
    
    //define and bind function to play button to change the img and variable which determine if animation runs
    $("#playButton").click(settings.playPause);
	
    //bind function which launches animation over time
    setInterval( function () {
        if (settings.animationPlaying){
            settings.changeIndex(settings.currentYearIndex + 1);
            settings.moveSlider();
        }
    } , 1500);
    
    //bind function which steps animation over one step at a time
    $("#forwardButton").click(settings.advanceAnimationForward);
    $("#backButton").click(settings.advanceAnimationBackward);
    //add event to slider so it can move the animation forward @
    $("#slider").on("input", function (e){
        console.log("change slider event fired");
        settings.changeIndex(Number(this.value));
        
    });
    //make the animation move according to keystrokes
    document.addEventListener("keydown" , function(event) {
        switch (event.key){
            case "ArrowRight":
                settings.advanceAnimationForward();
                event.preventDefault();
                break;
            case "ArrowLeft":
                settings.advanceAnimationBackward();
                event.preventDefault();
                break;
        }
    })
    
}


//launches the script after the rest of the document has been loaded
window.onload = runMain()