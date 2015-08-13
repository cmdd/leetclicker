// TODO: Single Game object?
// TODO: AUTO-SAVING!
//       Save time saved. (ie. add a "timeSaved" field to the save)

// TODO: Scoping to prevent changing values from console

// TODO: Event listeners (onclick) instead of inline js in html

// TODO: Make the binary/SI switch do something

// TODO: Separate function for parsing bytes into human readable (eg. 14 kB)
//       If # is too big, use exponent form (1235e+5) via .toExponential()

// TODO: "Activity" function, takes a tab ("Main", etc) as an argument and flashes the bg color

// TODO: If values are same (when updating), don't change (maybe)

// TODO: Make extra purchases of buildings not directly change the buildings object

// TODO: Display cost (upgrades, buildings) and amount owned (buildings)

// js prototypes because js is stupid and awful
Number.prototype.toFixedDown = function(digits) {
  var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
      m = this.toString().match(re);
  return m ? parseFloat(m[1]) : this.valueOf();
};

var socket = io();
var authorized = "waiting";
var remoteSave = "waiting";

var bytes = 0;
var bytesTotal = 0;

var bps = 0;

var useSystem = "SI";
var systems = {
  "SI": {
    "base": 1000,
    "suffix": ["B", "kB", "MB"]
  },
  "binary": {
    "base": 1024,
    "suffix": ["B", "KiB", "MiB"]
  }
};

// TODO: Should this be Object.create(null) instead?
//       Should this be an object of objects? (eg. "a": {amount: 0, etc.})
// TODO: Should flavor text (not description, in italics, usually humorous) be separate or part of desc?
var buildings = {
  "a": {
    "name": "meh",
    "description": "An awful dial-up box. Pathetic.<br><em>Fun fact: The dial-up connection was create over 10,000 years ago, during a time when rms was a fledgling teenager.</em>",
    "amount": 0,
    "cost": 10,
    "bps": 1
  },
  "b": {
    "name": "GTX 980 Ti",
    "description": "I lied.",
    "amount": 0,
    "cost": 35,
    "bps": 10
  }
};

// TODO: An object which contains objects (upgrades)
//       All upgrades listed. If upgrade is simple (add bps), completely listed
//       If not simple, only bought status listed, and upgrade logic placed in another function. (One of the loops)

// TODO: Should "bought" just remove the upgrade?

// TODO: If bytesTotalRequired is > than amount of total/current bytes, don't show
//       Use sanity check loop for this
var upgrades = {
  "ramUpgrade": {
    "name": "RAM Upgrade",
    "description": "Nice meme!",
    "target": "a",
    "bought": false,
    "bytesTotalRequired": 0,
    "cost": 5,
    "upAmount": 2
  }
}

// TODO: If person is authenticated, should it save to localstorage?
// TODO: Server-side save
function saveGame() {
  var buildingArray = [];
  var upgradeArray = [];
  var stats = {
    bytes: bytes,
    bytesTotal: bytesTotal
  };
  for (var building in buildings) {
    buildingArray.push({
      name: building,
      amount: buildings[building].amount
    });
  }
  for (var upgrade in upgrades) {
    upgradeArray.push({
      name: upgrade,
      bought: upgrades[upgrade].bought
    });
  }
  if (authorized === true) {
    socket.emit('save game', {'buildings': buildingArray, 'upgrades': upgradeArray, 'stats': stats});
    addLog("Saved remotely.");
  } else {
    console.log(JSON.stringify(buildingArray));
    localStorage.setItem('buildings', JSON.stringify(buildingArray));
    localStorage.setItem('upgrades', JSON.stringify(upgradeArray));
    localStorage.setItem('stats', JSON.stringify(stats));
    addLog("Saved locally.");
  }
}

// TODO: If person is being ddosed or whatever, prevent loading
function loadGame() {
  if (authorized === true && remoteSave === true) {
    socket.emit('load game');

    socket.on('load data', function(data) {
      // why am I still using _Parsed for variable names, even though I'm not parsing anything?
      // I'm lazy, that's why.
      var buildingsParsed = data.buildings;
      var upgradesParsed = data.upgrades;
      var statsParsed = data.stats;

      for (var building in buildings) {
        for (var sb in buildingsParsed) {
          if (buildingsParsed[sb].name === building) {
            buildings[building].amount = buildingsParsed[sb].amount;
          }
        }
      }
      for (var upgrade in upgrades) {
        for (var su in upgradesParsed) {
          if (upgradesParsed[su].name === upgrade) {
            upgrades[upgrade].bought = upgradesParsed[su].bought;
          }
        }
      }
      bytes = statsParsed.bytes;
      bytesTotal = statsParsed.bytesTotal;

      addLog("Successfully loaded a previous remote save.");
    });
  } else if (!(localStorage.buildings) && !(localStorage.upgrades) && !(localStorage.stats)) {
    addLog("Load attempt failed: no save available.");
  } else if (!(localStorage.buildings) || !(localStorage.upgrades) || !(localStorage.stats)) {
    addLog("Load attempt failed: a part of the save is missing; save is corrupt.")
  } else {
    var buildingsParsed = JSON.parse(localStorage.getItem('buildings'));
    var upgradesParsed = JSON.parse(localStorage.getItem('upgrades'));
    var statsParsed = JSON.parse(localStorage.getItem('stats'));

    for (var building in buildings) {
      for (var sb in buildingsParsed) {
        if (buildingsParsed[sb].name === building) {
          buildings[building].amount = buildingsParsed[sb].amount;
        }
      }
    }
    for (var upgrade in upgrades) {
      for (var su in upgradesParsed) {
        if (upgradesParsed[su].name === upgrade) {
          upgrades[upgrade].bought = upgradesParsed[su].bought;
        }
      }
    }
    bytes = statsParsed.bytes;
    bytesTotal = statsParsed.bytesTotal;

    addLog("Successfully loaded a previous local save.");
  }
}

// TODO: Verification
function deleteSave(location) {
  switch(location) {
    case "local":
      localStorage.clear();
      break;
    case "remote":
      socket.emit('wipe save');
      break;
    case "all":
      localStorage.clear();
      socket.emit('wipe save');
      break;
  }

  // TODO: Should this not reload from cache (ie. use location.reload(true))?
  window.location.reload();
}

function changeSystems(unit) {
  useSystem = unit;
}

function buyBuilding(building) {
  var amount = buildings[building].amount;
  var cost = buildings[building].hasOwnProperty("costMulti") ? Math.floor(buildings[building].cost * Math.pow(buildings[building].costMulti, buildings[building].amount)) : Math.floor(buildings[building].cost * Math.pow(1.1, buildings[building].amount));

  if (bytes >= cost) {
    buildings[building].amount += 1;
    bytes -= cost;
  }
}

function buyUpgrade(upgrade) {
  if (upgrades[upgrade].bought === false && buildings[upgrades[upgrade].target].amount > 0) {
    upgrades[upgrade].bought = true;
    bytes -= upgrades[upgrade].cost;
    // buildings[upgrades[upgrade].target].bps *= upgrades[upgrade].upAmount;
  }
}

// TODO: Use value of Object to calculate amount per click
function clickAdd() {
  bytes += 1;
  bytesTotal += 1;
}

// TODO: Account for special upgrades that don't directly affect building bps
function bpsCalc() {
  // TODO: This calculates bps based on buildings
  var buildingBps = 0;
  bps = 0;
  $.each(buildings, function(index, value) {
    buildingBps = value.bps;
    $.each(upgrades, function(ui, uv) {
      var name = uv.target;
      if (name === index && uv.bought === true) {
        buildingBps *= uv.upAmount;
      }
    });
    bps += value.amount * buildingBps;
  });
  // console.log(bps);
}

function updateScreen(ups) {
  // NOTE: ups = updates per second
  bytes += bps / ups;
  bytesTotal += bps / ups;

  // console.log(bytes);

  var numSuffix = Math.floor(Math.log(bytes) / Math.log(systems[useSystem].base));
  numSuffix = numSuffix < 0 ? 0 : numSuffix;
  numSuffix = numSuffix >= systems[useSystem].suffix.length ? systems[useSystem].suffix.length - 1 : numSuffix
  var bySuffix = systems[useSystem].suffix[numSuffix];

  $("#bytes").text(((bytes / (Math.pow(systems[useSystem].base, numSuffix) >= 1 ? Math.pow(systems[useSystem].base, numSuffix) : 1)).toFixedDown(numSuffix === 0 ? 0 : 3)) + " " + bySuffix);

  var bpsNumSuffix = Math.floor(Math.log(bps) / Math.log(systems[useSystem].base));
  bpsNumSuffix = bpsNumSuffix < 0 ? 0 : bpsNumSuffix;
  bpsNumSuffix = numSuffix >= systems[useSystem].suffix.length ? systems[useSystem].suffix.length - 1 : bpsNumSuffix
  var bpsSuffix = systems[useSystem].suffix[bpsNumSuffix] + "/s";

  $("#bps").text(bps + " " + bpsSuffix);

  $("#bytes-navbar").html("<strong>" + ((bytes / (Math.pow(systems[useSystem].base, numSuffix) >= 1 ? Math.pow(systems[useSystem].base, numSuffix) : 1)).toFixedDown(numSuffix === 0 ? 0 : 3)) + " " + bySuffix + "</strong> + " + bps + " " + bpsSuffix);
}

// TODO: Different time format
function addLog(text) {
  var d = new Date();
  var m = d.getMonth() + 1;
  var min = ('0' + d.getMinutes()).slice(-2);
  var sec = ('0' + d.getSeconds()).slice(-2);
  var date = m + "/" + d.getDate() + "/" + d.getFullYear() + " " + d.getHours() + ":" + min + ":" + sec;

  var text = "[<strong>" + date + "</strong>] " + text;
  $("#log").prepend("<p>" + text + "</p>");
}

// TODO: Sanity checks at set intervals (either game update loop or game communicate loop)
//       eg. if total cost of buildings is > than total accumulated bytes, something is wrong

// TODO: For achievements, reinitalize achievements variable on every sanity check, with conditions as one of the fields
//       eg. var achievements = {"achievement_1": {"reached": bytes > 10}}
//       Check if true, give achievement.
window.setInterval(function() {
  bpsCalc();
  updateScreen(10);
  // bytes += bps;
}, 1000/10);

// Temporary sanity check loop
window.setInterval(function() {
  // Checks to see which upgrades can be listed for purchase
  // TODO: Replace with $.each
  var bought = 0;
  var first = true;

  for (var upgrade in upgrades) {
    var upgradeItem = upgrades[upgrade];
    if (buildings[upgradeItem.target].amount > 0 && upgradeItem.bought === false && upgradeItem.bytesTotalRequired <= bytesTotal) {
      if ($("#upgrade-list").find("#" + upgrade + "").length === 0){
        $("#upgrade-list").append('<li id="' + upgrade + '" class="list-group-item"><h4 class="list-group-item-heading">' + upgradeItem.name + "</h4><p class=\"list-group-item-text\">" + upgradeItem.description + "</p><br /><button id=\"" + upgrade + "-ub\" class=\"btn btn-default disabled\" onClick=\"buyUpgrade('" + upgrade + "')\">Buy this upgrade!</button></li>");
      }

      if (upgradeItem.cost <= bytes) {
        $("#" + upgrade + "-ub").removeClass("disabled").removeAttr("data-toggle title");
      } else {

        var bytesDiff = upgradeItem.cost - bytes;
        var diffNumSuffix = Math.floor(Math.log(bytesDiff) / Math.log(systems[useSystem].base));
        diffNumSuffix = diffNumSuffix < 0 ? 0 : diffNumSuffix;
        diffNumSuffix = diffNumSuffix >= systems[useSystem].suffix.length ? systems[useSystem].suffix.length - 1 : diffNumSuffix
        var diffSuffix = systems[useSystem].suffix[diffNumSuffix];

        var text = ((bytesDiff / (Math.pow(systems[useSystem].base, diffNumSuffix) >= 1 ? Math.pow(systems[useSystem].base, diffNumSuffix) : 1)).toFixedDown(diffNumSuffix === 0 ? 0 : 3)) + " " + diffSuffix;

        $("#" + upgrade + "-ub").addClass("disabled").attr("data-toggle", "tooltip").attr("title", "You're missing " + text);

      }
    } else if (upgradeItem.bought === true && !($("#" + upgrade + "-ub").hasClass("disabled"))) {
      $("#" + upgrade + "-ub").text("Bought!").addClass("disabled").attr("data-toggle", "tooltip").attr("title", "You've already bought this item!");
    }
  }

  for (var key in buildings) {
    var value = buildings[key];

    if (first === true) {
      bought = value.amount;
      first = false;
    } else if (value.hasOwnProperty("prevRequired")) {
      if (bought >= value.prevRequired) {
        bought = value.amount;
      } else {
        continue;
      }
    } else if (bought >= 5) {
      bought = value.amount;
    } else {
      continue;
    }

    // console.log(key + ": " + value);

    if ($("#building-list").find("#" + key + "").length === 0) {
      $("#building-list").append('<div class="building col-md-4" id="' + key + '"><h4>' + value.name + '</h4><p>' + value.description + '</p><button id="' + key + '-bb" type="button" class="btn btn-default disabled" onClick="buyBuilding(\'' + key + '\')">Buy it!</button></div>');
    }

    if (value.cost <= bytes) {
      $("#" + key + "-bb").removeClass("disabled").removeAttr("data-toggle title");
    } else {
      var bytesDiff = value.cost - bytes;
      var diffNumSuffix = Math.floor(Math.log(bytesDiff) / Math.log(systems[useSystem].base));
      diffNumSuffix = diffNumSuffix < 0 ? 0 : diffNumSuffix;
      diffNumSuffix = diffNumSuffix >= systems[useSystem].suffix.length ? systems[useSystem].suffix.length - 1 : diffNumSuffix
      var diffSuffix = systems[useSystem].suffix[diffNumSuffix];

      var text = ((bytesDiff / (Math.pow(systems[useSystem].base, diffNumSuffix) >= 1 ? Math.pow(systems[useSystem].base, diffNumSuffix) : 1)).toFixedDown(diffNumSuffix === 0 ? 0 : 3)) + " " + diffSuffix;

      $("#" + key + "-bb").addClass("disabled").attr("data-toggle", "tooltip").attr("title", "You're missing " + text);
    }

  }
  // TODO: buildings
}, 1000/5);

/*
window.setInterval(function () {
  TODO: communicate w/ server
}, 1000);
*/

$(function() {
  // $('[data-toggle="tooltip"]').tooltip();

  $("[name='check-system']").bootstrapSwitch();

  $('#radio-theme-default, #radio-theme-hacker').change(function() {
    var stylesheets = {
      "radio-theme-default": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.5/css/bootstrap.min.css",
      "radio-theme-hacker": "http://brobin.github.io/hacker-bootstrap/css/hacker.css"
    };

    if (this.checked) {
      $("#bootstrap-stylesheet").attr('href', stylesheets[this.id]);
    }
  });

  $("#navbar-brand, #bytes-nav-li").click(function() {
    $("#nav-tabs a[href='#main']").tab('show');
  });
});

socket.on('auth-check', function(data) {
  if (data.auth === "yes-auth") {
    authorized = true;
    if (data.saveData === true) {
      remoteSave = true;

    } else {
      remoteSave = false;
    }
  } else {
    authorized = false;
  }
  if (remoteSave === true && authorized === true) {
    loadGame();
    addLog("Welcome back to leetclicker. Your remote save has been restored.")
  } else if (localStorage.getItem('buildings') !== null && localStorage.getItem('upgrades') !== null && localStorage.getItem('stats') !== null) {
    loadGame();
    addLog("Welcome back to leetclicker. Your local save has been restored.")
  } else {
    addLog("Welcome to leetclicker.");
  }
});

setTimeout(function() {
  if (authorized === "waiting") {
    authorized = false;
    remoteSave = false;
  }
}, 10000);
