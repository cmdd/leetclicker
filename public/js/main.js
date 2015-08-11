// TODO: Single Game object?

// TODO: Scoping to prevent changing values from

// js prototypes because js is stupid and awful
Number.prototype.toFixedDown = function(digits) {
  var re = new RegExp("(\\d+\\.\\d{" + digits + "})(\\d)"),
      m = this.toString().match(re);
  return m ? parseFloat(m[1]) : this.valueOf();
};

var bytes = 0;
var bytesTotal = 0;

var bps = 0;

var suffix = ["B", "kB", "MB"]

// TODO: Should this be Object.create(null) instead?
//       Should this be an object of objects? (eg. "a": {amount: 0, etc.})
var buildings = {
  "a": {
    "amount": 0,
    "cost": 10,
    "bps": 1
  },
  "b": {
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

function buyBuilding(building) {
  var amount = buildings[building].amount;
  var cost = buildings[building].cost;
  var newCost = Math.floor(cost * 1.1);

  if (bytes >= cost) {
    buildings[building].amount += 1;
    bytes -= cost;
    // $("#bytes").text(bytes);
    buildings[building].cost = newCost;
  }
}

function buyUpgrade(upgrade) {
  if (upgrades[upgrade].bought === false && buildings[upgrades[upgrade].target].amount > 0) {
    upgrades[upgrade].bought = true;
    bytes -= upgrades[upgrade].cost;
    buildings[upgrades[upgrade].target][2] *= upgrades[upgrade].upAmount;
  }
}

// TODO: Use value of Object to calculate amount per click
function clickAdd() {
  bytes += 1;
}

function bpsCalc() {
  // TODO: This calculates bps based on buildings
  bps = 0;
  $.each(buildings, function(index, value) {
    bps += value.amount * value.bps;
  });
  // console.log(bps);
}

function updateScreen(ups) {
  // NOTE: ups = updates per second
  bytes += bps / ups;

  // console.log(bytes);

  var numSuffix = Math.floor(Math.log(bytes) / Math.log(1000));
  numSuffix = numSuffix < 0 ? 0 : numSuffix;
  numSuffix = numSuffix >= suffix.length ? suffix.length - 1 : numSuffix
  var bySuffix = suffix[numSuffix];

  $("#bytes").text((bytes / (Math.pow(1000, numSuffix) >= 1 ? Math.pow(1000, numSuffix) : 1)).toFixedDown(numSuffix === 0 ? 0 : 3));
  $("#unit").text(bySuffix);

  var bpsNumSuffix = Math.floor(Math.log(bps) / Math.log(1000));
  bpsNumSuffix = bpsNumSuffix < 0 ? 0 : bpsNumSuffix;
  bpsNumSuffix = numSuffix >= suffix.length ? suffix.length - 1 : bpsNumSuffix
  var bpsSuffix = suffix[bpsNumSuffix] + "/s";

  $("#bps").text(bps + " " + bpsSuffix);
}

// TODO: Sanity checks at set intervals (either game update loop or game communicate loop)
//       eg. if total cost of buildings is > than total accumulated bytes, something is wrong

// TODO: For achievements, reinitalize achievements variable on every sanity check, with conditions as one of the fields
//       eg. var achievements = {"achievement_1": {"reached": bytes > 10}}
//       Check if true, give achievement.
window.setInterval(function() {
  bpsCalc();
  updateScreen(30);
  // bytes += bps;
}, 1000/30);

// Temporary sanity check loop
window.setInterval(function() {
  // Checks to see which upgrades can be listed for purchase
  // TODO: Replace with $.each
  var bought = 0;
  var first = true;

  for (var upgrade in upgrades) {
    var upgradeItem = upgrades[upgrade];
    if (buildings[upgradeItem.target].amount > 0 && upgradeItem.bought === false && upgradeItem.bytesTotalRequired <= bytesTotal && $("#upgrade-list").find("#" + upgrade + "").length === 0) {
      $("#upgrade-list").append('<li id="' + upgrade + '" class="list-group-item"><h4>' + upgradeItem.name + "</h4><p>" + upgradeItem.description + "</p></li>");
    }
  }

  for (var key in buildings) {
    var value = buildings[key];

    if (first === true || bought >= 5) {
      bought = value.amount;
      first = false;
    } else {
      continue;
    }

    // console.log(key + ": " + value);

    if ($("#building-list").find("#" + key + "").length === 0) {
      $("#building-list").append('<p id="' + key + '">Test</p>');
    }

  }
  // TODO: buildings
}, 1000/5);

/*
window.setInterval(function () {
  TODO: communicate w/ server
}, 1000);
*/
