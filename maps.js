var map; // map data
var markersArray = []; // marker data
var listmem; // list of markers

var panorama; // for map canvas
var directionsDisplay; // for directions
var trafficLayer; // for traffic layer

// for APIs
var svService = new google.maps.StreetViewService();
var directionsService = new google.maps.DirectionsService();

// when the page is loaded, get mapdata and initialize
$(function() {
  $.ajax({
    url: "mapdata.json",
    cache: false,
    dataType: "json",
    success: function(json) {
      var data = jsonRequest(json);
      initialize(data);
    }
  });
});

// Initialize function
// draw map window and put makers
function initialize(data) {
  // Set the center of San Francisco
  var latlng = new google.maps.LatLng(37.779598, -122.420143);
  var myOptions = {
    zoom: 12,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"),
      myOptions);
  directionsDisplay = new google.maps.DirectionsRenderer();

  // create a html for information window of each maker
  for (i in data) {
    var dat = data[i];
    var infohtml =
      '<div id="info"><b>' + dat.name + '</b><br>' + 
      dat.street + '<br>' +dat.city + '<br>' +
      'Tel: ' +  dat.tel + ' Fax: ' + dat.fax + '<br>' +
      '<hr>Search Direction From:<br><input type="text" id="origin"><br>' +
      '<input type="radio" name="travelmode" value="driving" checked>Drive&nbsp;&nbsp;' +
      '<input type="radio" name="travelmode" value="walking">Walk<br>' +
      '<input type="checkbox" name="highway" value="highway">Avoid Highways&nbsp;&nbsp;' +
      '<input type="checkbox" name="traffic" value="traffic">Show Traffic<br>' +
      '<input type="button" id="getdirection" value="Get Direction To Here" onClick="getDirection(' + i + ');"><br>' +
      '<hr><input type="button" value="Street View" onClick="toggleStreetView(' + i + ');">' +
      '<div id="streetview">&nbsp;</div></div>';
    var listhtml =
      '<b><a href="#" onClick="showInfoWindow(' + i + ');">' + dat.name + '</a></b><br>' +
      dat.street + '<br>' + dat.city;

    var marker = new google.maps.Marker({
      position: new google.maps.LatLng(dat.lat, dat.lng),
      map: map,
      html: infohtml,
      listhtml: listhtml,
    });
    var infowindow = new google.maps.InfoWindow({
      content: "loading..."
    });

    google.maps.event.addListener(marker, 'click', function() {
      infowindow.setContent(this.html);
      infowindow.open(map, this);
    });
    markersArray.push(marker);
  }
  drawListhtml();
}

// get marker objects from json object
function jsonRequest(json) {
  var data = [];
  if (json.Marker) {
    var n = json.Marker.length;
    for (var i=0; i<n; i++) {
      data.push(json.Marker[i]);
    }
  }
  return data;
}

// Show info window in the map
function showInfoWindow(i) {
  if (panorama != null && panorama.getVisible()) {
    panorama.setVisible(false);
  }
  google.maps.event.trigger(markersArray[i], "click");
}

// Get direction of choosed marker
function getDirection(i) {
  var destination = markersArray[i];
  var origin = $("#origin").val();
  if (origin == null || origin == "") {
    $("#directions").html("please input the origin address");
  } else {
    var travelmode = $("input:radio[name=travelmode]:checked").val();
    if (travelmode == "walking") {
      travelmode = google.maps.DirectionsTravelMode.WALKING;
    } else {
      travelmode = google.maps.DirectionsTravelMode.DRIVING;
    }
    var highway = $(':checkbox[name="highway"]');
    var avoidhighways = false;
    if (highway.is(':checked')) {
      avoidhighways = true;
    }   
    var request = {
      origin: origin,
      destination: destination.getPosition(),
      travelMode: travelmode,
      unitSystem: google.maps.DirectionsUnitSystem.IMPERIAL,
      provideRouteAlternatives: false,
      avoidHighways: avoidhighways
    };
    directionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        var traffic = $(':checkbox[name="traffic"]');
        if (traffic.is(':checked')) {
          trafficLayer = new google.maps.TrafficLayer();
          trafficLayer.setMap(map);
        } 
        directionsDisplay.setMap(map);
        directionsDisplay.setDirections(result);
        var topdiv = document.createElement("div");
        topdiv.id = "close";
        topdiv.innerHTML = '<a href="#" onClick="closeDirections();">Close Directions</a>';
        var directiondiv = document.createElement("div");
        directiondiv.id = "directions";
        var list = document.getElementById("list");
        list.innerHTML = "";
        list.appendChild(topdiv);
        list.appendChild(directiondiv);
        directionsDisplay.setPanel(document.getElementById("directions"));
      }
    });
  }
}

// Close directions when the directions are on the left-side list
function closeDirections() {
  directionsDisplay.setMap(null);
  if (trafficLayer != null && trafficLayer.getMap() != null) {
    trafficLayer.setMap(null);
  }
  $("#list").html(listmem);
}

// Show street view
function toggleStreetView(i) {
  svService.getPanoramaByLocation(markersArray[i].getPosition(), 100, function(result, status) {
    if (status == google.maps.StreetViewStatus.OK) {
      panorama = map.getStreetView();
      panorama.setPosition(result.location.latLng);
      panorama.setVisible(true);
    } else {
      if (panorama != null && panorama.getVisible()) {
        panorama.setVisible(false);
      }
      $("#streetview").html("sorry, street view is not available at this location");
    }
  });
}

// Draw the list of markers 
function drawListhtml() {
  var listhtml = "";
  var alphabetNum = 65; //A
  for (i in markersArray) {
    if (markersArray[i].getMap() != null) {
      if ((i % 2) == 0) {
        li = '<li class="even"><b>(' + String.fromCharCode(alphabetNum) + ')</b> ';
      } else {
        li = '<li><b>(' + String.fromCharCode(alphabetNum) + ')</b> ';
      }
      listhtml += li + markersArray[i].listhtml + "</li>";
      if (markersArray[i].category == "Branch") {
        markersArray[i].setIcon(
          "http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=" +
           String.fromCharCode(alphabetNum) + "|FFFFFF|000000");
      } else {
        markersArray[i].setIcon("http://www.google.com/mapfiles/marker" + 
          String.fromCharCode(alphabetNum) + ".png");
      }
      alphabetNum++;
    }
  }
  listmem = "<ul>" + listhtml + "</ul>";
  $("#list").html(listmem);
}

