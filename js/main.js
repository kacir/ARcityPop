function runMain() {
    
    //function makes a Geojson layer object and gives it some methods and properties specific to time animation project
    //its kind of an object constructor but not
    function makeLayer (geojsonPath, options, fieldListPercent, fieldListRawValue, legendHTML, legendHTMLMissing, missingDataIndex) {
        
        //make the empty geojson layer object
        console.log("making layer object");
        var layerGroup = L.geoJSON(null , options);
        
        layerGroup.geojsonPath = geojsonPath;//set the Geojson path as an attribute so it can be used layer on after object modification
        //set up a loadData function that does the ajax call to add data into the geojson layer object. will be call on later
        layerGroup.loadData = function () {
            //make an ajax call to get the data
            $.ajax(layerGroup.geojsonPath , {
                datatype : "json",
                success: function (response) {
                    console.log("about to load ajax data into Geojson layer");
                    var parsed = JSON.parse(response);
                    layerGroup.addData(parsed);
                    console.log("successfully added data into layer");
                }
            }).fail(function() {alert("Unable to load data");});
        }
        
        
        //give it properties that will be used by the settings object to make the animation move forward.
        layerGroup.fieldListPercent = fieldListPercent;//an array of field names inside of the geojson object that represent percentages
        layerGroup.fieldListRawValue = fieldListRawValue;//an array of field names inside of the geojson object that represent the raw value for each year
        layerGroup.legendHTML = legendHTML;//The default html content that will be displayed in the legend when the layer is on
        layerGroup.currentPercentField = fieldListPercent[0];//a shortcut value which respresents what the current percent field name is based on the current year. the first year has an index of zero.
        layerGroup.currentRawValueField = fieldListRawValue[0];//a shortcut value which represents what the current raw field name is based on the current year.
        layerGroup.missingDataIndex = missingDataIndex;//the index of a year that might be missing data to symbolize on
        
        //making some properties accessable long after the layer has been created
        layerGroup.style = options.style;
        layerGroup.createPopup = options.onEachFeature;
        
        //assign a method which resets all of the popups and symbology based on the current year
        layerGroup.updateLook = function () {
            
            //changes the index shortcuts for the percent field name and raw value field name based on the current year to be displayed
            layerGroup.currentPercentField = layerGroup.fieldListPercent[settings.currentYearIndex];
            layerGroup.currentRawValueField = layerGroup.fieldListRawValue[settings.currentYearIndex];
            
            //if the layer symoblogy is normal and it is not a missing data index
            if (layerGroup.missingDataIndex != settings.currentYearIndex) {
                layerGroup.setStyle(layerGroup.style);//should reset the style of every layer in the layer group according to the default
            
                //resets the popups according to the current year
                layerGroup.eachLayer(function(layer){
                    layerGroup.createPopup(layer.feature, layer);
                });
            } else {
                //if it is a missing data index then reset the style and close any open popups inside of the geojson layer
                //if the layer is not showing up there should not be a popup left over from clicking on it in a differenet year
                //this fixes that bug
                layerGroup.setStyle(layerGroup.style)
                layerGroup.closePopup();
            }
            
        }
        
        //give the layer back so it can be dealt with outside of the protoype construction function
        return layerGroup;
        
    }
    
    
    
	//globalish object which contains attributes and methods used to react to events in the DOM, manage the time animation in relation to interface behavior.
    var settings = {
        animationPlaying : false,//indicates if the play button is active so the animation can step forward overtime
        currentYearIndex : 0,//the index position in the list of the current point in time shown on map
        fieldLabel : ["2010" , "2011" , "2012" , "2013" , "2014" , "2015" , "2016"],//list of year labels that will be shown to the user in the year div element.
        
        
        //method changes the index for the current year shown in the map. This is a general method 
        //which takes care of ui and properties related actions which all UI elements need to change
        //when the year changes for the map
        changeIndex :  function (index) {
            settings.currentYearIndex = index;//holds the index position of the current year inside of the fieldLabel array property
            
            //tests to prevent index from going out of range
            if (settings.currentYearIndex === -1) {settings.currentYearIndex = settings.fieldLabel.length - 1;}
            if (settings.currentYearIndex > settings.fieldLabel.length -1) {settings.currentYearIndex = 0;}
            console.log("Current Index is " + settings.currentYearIndex)
            
            //makes it easier to set the year information in the year div because the text is aready constructed
            settings.label = "Year: " + settings.fieldLabel[index];
            
            //sets UI elements according to index status
            yearControl.html(settings.label);//changes the label shown in year div
            settings.disableButtons();//disable or enable certain buttons based on what the index is
            cityLayer.updateLook();//refresh the style of the city layer to match the current year
            countiesLayer.updateLook();//refresh the style of the counties layer to match the current year
            settings.legendUpdate();//change the contents of the legend based on the current year, data might be missing from the counties layer
            
            return settings;
        },
        //creates and binds popup text for the counties layer
        countyPopupTextConstruct : function(feature, layer) {
                var percentChange = feature.properties[countiesLayer.currentPercentField];//the percent change value of the individual feature
                var countyName = feature.properties["name"];//the name of the county feature
                var rawValue = feature.properties[countiesLayer.currentRawValueField];//the raw value of the individual feature
                
                //construct the contents of the popup and bind the the layer
                layer.bindPopup("<H3>" + countyName + " County: </H3> <p class='popupText'> " + percentChange + "% change in income (originally $" + rawValue + ") </p>");
        },
        
        //disables or enables the back and forward buttons depend on if the current year is the last or first year
        disableButtons : function () {
            
            //if the index is 0 disable the backword button, otherwise leave it enabled
            console.log("Disable Button function Triggered!");
            if (settings.currentYearIndex === 0){
                $("#backButton").attr("disabled" , "");
            } else {
                if ($("#backButton")[0].hasAttribute("disabled")) {
                    $("#backButton").removeAttr("disabled");
                }
            }
            
            //if the last year is the current year disable the forward button and change the playbutton into a replay button
            if (settings.currentYearIndex === settings.fieldLabel.length -1) {
                $("#forwardButton").attr("disabled" , "");
                settings.forcedPause();
                $("#playButton")[0].innerHTML = '<img width="10" src="img/replay.png">';
            } else {
                //if it is not the last year then enable the forward button
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
        moveSlider : function (sliderValue) {
            var slider = $("#slider");
            //not sure which of these values actually correctly sets the new slider value so I call on both
            slider.val(sliderValue).change();
            slider.attr("value", sliderValue);
            //after the value has been switched it needs this for it to take
            slider.val(sliderValue).change();
            yearControl.html("Year : " + settings.fieldLabel[settings.currentYearIndex]);//change the year control's contetns to match the current year
        },
        
        //method is tied to both forward button and arrow key forward. advances animation forward by one year
        advanceAnimationForward : function () {
            if (!$("#forwardButton")[0].hasAttribute("disabled")) {
                settings.playSound();
                settings.forcedPause();
                settings.changeIndex(settings.currentYearIndex + 1);
                settings.moveSlider(settings.currentYearIndex);
            }
        },
        
        //method is tied to both backward button and backward arrow key. adances the animation backward by one year
        advanceAnimationBackward : function () {
            if (!$("#backButton")[0].hasAttribute("disabled")) {
                settings.playSound();
                settings.forcedPause();
                settings.changeIndex(settings.currentYearIndex - 1);
                settings.moveSlider(settings.currentYearIndex);
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
                console.log("Play on .....");
            }
        },
        
        //method called when backward or forward action is called. it prevents the playing animation to
        //advance automatically
        forcedPause : function () {
            settings.animationPlaying = false;
            $("#playButton")[0].innerHTML = '<img width="10" src="img/play.png"/>';
        },
        
        //changes the contents of the legend according to the current year and what layers are on.
        legendUpdate : function() {
            var legendHTML = "<h3>Legend</h3>";
            
            //if the cityLayer is on then add its into the legend
            if(map.hasLayer(cityLayer)) {
                legendHTML = legendHTML + cityLayer.legendHTML;
            }
            
            //if the counties layer is in the map add its contents to the map unless it has an index of 6 where there is no data. add
            //diffrent content to alert the user there is no data avaliable for that year
            if (map.hasLayer(countiesLayer)) {
                if (settings.currentYearIndex == 6) {
                    legendHTML = legendHTML + "<p id='missingData'>Income data is not avaliable for this year</p>";
                } else {
                    legendHTML = legendHTML + countiesLayer.legendHTML;
                }
            }
            //set the legend contents according to the constructed string
            legendControl._div.innerHTML = legendHTML;
            
        }
        
    };
    

    
    
    
    
    
    
    
    
    //generates style object for city layer
    function animationStyleCity (feature) {
        var style = {
            fillColor: "#ff7800",
            fillOpacity : 0.5,
            opacity : 0.8
        };
        
        
        
        //create a factor to increase symbol size as you are zooming in
        var scaleFactor = map.getZoom() - 6;
        
        //set the color according to if the % is negitive positive or zero
        if (feature.properties[cityLayer.currentPercentField] == 0) {
            style.color = "#2F4F4F";
            style.fillColor = "#2F4F4F";
            style.radius = 1 * scaleFactor;
        } else {
            //set color to green if the more than 1
            if (feature.properties[cityLayer.currentPercentField] > 0) {
                style.color = "#006400";
                style.fillColor = "#006400";
            } else {
                style.color = "red";
                style.fillColor = "red";
            }
            
        
            //calculate the radious needed. using the square root minimizes the effect of extreme large values, absolute value is needed to prevent negetive radious values.
            style.radius = Math.sqrt(Math.abs(feature.properties[cityLayer.currentPercentField])) * 25 * scaleFactor;
        }
        
        //if the counties layer is in the map then change it so the cities layer does not have any opacity.
        //this helps disdingush the two layers from each other when both are turned on
        if (map.hasLayer(countiesLayer)) {
            style.fillOpacity = 1;
            style.opacity = 1;
            style.color = "black";
        }
        
        return style;
    }
    
    //generates style object for county layer
    function animationStyleCounty (feature) {
        //default style values
        var style = {
            color: "grey",
            opacity : 0.95,
            fillOpacity : 0.4,
            weight : 0.5
        };
        
        //if the current year is 2016 the layer has no data for this year so just make the symbology disappear
        if (countiesLayer.currentPercentField == 'perCh2016') {
            style.opacity = 0;
            style.fillColor = 'none';
            return style;
        }
        
        //get the value of the percentage field for the feature
        var percentChange = Number(feature.properties[countiesLayer.currentPercentField]);
        
        //counties with no population change get a value of zero
        if (percentChange == 0) {
            style.opacity = 1;
            style.fillColor = 'black';
        } else {
            //if the value is positive it needs to be green for growing
            if (percentChange > 0){
                style.fillColor = "green";
                
            } else {
                //if the value is negeitive the city is shrinking then it should be red.
                style.fillColor = "red";
                
            }
        }
        return style;
    }
    
    
    
    

    //load a bounding box dataset which decides the maximum panning area of the map.
    //it helps prevent the user from getting lost.
    var mapOuterBounds = "placeholder";//need a placholder at at higher scope so that when its created inside of the ajax function its accessible at this scope.
    $.ajax("data/BoundingBox.json" , {
        datatype : "json",
        success: function (response){
            console.log("starting to make bounds");
            console.log(jsonString);
            console.log("Attmpting to parse json");
            var jsonString = JSON.parse(response);
            
            
            mapOuterBounds = L.geoJSON(jsonString).getBounds();
            console.log("bounds have been made");
        }
    }).fail(function() {alert("Unable to load bouding data");});
    
    
    
    
    //generate the layer object for the counties dataset
    console.log("making counties layer");
    var countiesLayer = makeLayer("data/COUNTIES.json", 
                           {style : animationStyleCounty, onEachFeature : settings.countyPopupTextConstruct},
                             ["perCh2010" ,"perCh2011", "perCh2012", "perCh2013", "perCh2014", "perCh2015", "perCh2016"],
                             ["income2010", "income2011", "income2012", "income2013", "income2014", "income2015", "income2016"],
                             "<ul><li><div class='square' id='countyGrowing'></div> Growing Income</li> <li><div class='square' id='countyShrinking'></div> Shrinking Income </li> <li> <div class='square' id='countynochange'></div> Income No Change</li>  </ul>",
                             "<p id='missingData'>Income data is not avaliable for this year</p>",
                             6
                          );
    //loading counties via ajax
    countiesLayer.loadData();
    
    
                       
    //create the map object that will display everything                   
    var map = L.map('map', {minZoom : 6 , maxZoom : 12 }).fitWorld();
    
    //generate the city layer object
    console.log("making city layer");
    var cityLayer = makeLayer("data/CITY.json",
                              {onEachFeature : bindFeaturePopup, style : animationStyleCity,
                                    pointToLayer : function (feature, latlng) {
                                    return L.circleMarker(latlng, {
                                    radius: 8,
                                    fillColor: "#ff7800",
                                    color: "#000",
                                    weight: 1,
                                    opacity: 1,
                                    fillOpacity: 0.8
                                    })
                                    }}, 
                               ["pop10_11" , "pop11_12" , "pop12_13" , "pop13_14" , "pop14_15" , "pop15_16" , "pop16_17"],
                               ["pop2010" , "pop2011", "pop2012", "pop2013", "pop2014", "pop2015", "pop2016"],
                               "<ul><li><div class='circle' id='growing'></div><span>Growing City</span></li><li> <div class='circle' id='shrinking'></div><span>Shrinking City</span></li><li> <div class='circle' id='nochange'></div><span>No Pop Change</span></li></ul><p>Note the larger the circle the larger the % change</p>",
                               "",
                               null
                             );
    
    cityLayer.addTo(map);//add to the map so the layer is on by default
    
    
    
    //add a legend control the map
    L.control.layers(null, {"City Population Growth" : cityLayer , "County Income" : countiesLayer}).addTo(map);
    
    
    
    //whenever the map zooms the city layer symbology will be reset so the symbel actually get larger as the user zooms in
    map.on('zoomstart zoom zoomend', function () {cityLayer.setStyle(animationStyleCity);})

    //add a dark basemap to the map
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
            "<p class='popupText'> The percent change is " + feature.properties[cityLayer.currentPercentField] + "% and the population was " + feature.properties[cityLayer.currentRawValueField].toLocaleString() + " </p>.";
        
        layer.bindPopup(popupText);
    }
    
    
    //gets the city data from ajax and calls the method to start chain of adding data to map
    $.ajax("data/CITY.json" , {
        datatype : "json",
        success: addJSONToMap
        }).fail(function() {alert("Unable to load data");});
    
    //reset symbology after zoom levels set correctly
    cityLayer.setStyle(animationStyleCity);
	
    
    
    
    
    
    
    
    
    
    
	
	
	//create a year label object which is used by many functions
    var yearControl = $(".yearControl");
    console.log("made year control");
    
    
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
    //after the legend is created update its contents
    settings.legendUpdate();
    
    
    
    
        
    
    
    //define and bind function to play button to change the img and variable which determine if animation runs
    $("#playButton").click(settings.playPause);
	
    //bind function which launches animation over time
    setInterval( function () {
        if (settings.animationPlaying){
            var sliderValue = Number($("#slider")[0].value) + 0.01;
            if (sliderValue > 6) {
                //if the slider value is out of index then place the value back at zero
                sliderValue = 0;
            }
            console.log("slider value : " + sliderValue);
            settings.changeIndex(Math.floor(sliderValue));
            settings.moveSlider(sliderValue);
        }
    } , 7);
    
    //bind function which steps animation over one step at a time
    $("#forwardButton").click(settings.advanceAnimationForward);
    $("#backButton").click(settings.advanceAnimationBackward);
    //add event to slider so it can move the animation forward @
    $("#slider").on("input", function (e){
        console.log("change slider event fired");
        settings.changeIndex(Math.floor(Number(this.value)));
        settings.animationPlaying = false;//stop the animation from playing after the user toys with slider
        
    });
    //make the animation move according to keystrokes
    document.addEventListener("keydown" , function(event) {
        switch (event.key){
            case "ArrowRight":
                settings.advanceAnimationForward();
                event.preventDefault();//prevents the arrow action for having the screen pan right
                break;
            case "ArrowLeft":
                settings.advanceAnimationBackward();
                event.preventDefault();//prevents the arrow action for having the screen pan left
                break;
        }
    })
    
    //symbology changes slightly based on which layers are on, the legend also changes content to match map contents
    map.on("overlayadd overlayremove", function (event) {
        console.log("updating map based on currently added layers");
        cityLayer.updateLook();//refresh the style of the map to reflect the current most year
        countiesLayer.updateLook();
        settings.legendUpdate();
        (map.hasLayer(cityLayer)) ? cityLayer.bringToFront() : null;//if the city layer is in the map make sure it is the top group layer
        
    });
    
}


//launches the script after the rest of the document has been loaded
console.log("Testing to see if Page works at all");
window.onload = runMain();