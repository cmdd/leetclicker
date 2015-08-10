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
  "a": [0, 10, 1],
  "b": [0, 150, 25]
};

// TODO: An object which contains objects (upgrades)
//       All upgrades listed. If upgrade is simple (add bps), completely listed
//       If not simple, only bought status listed, and upgrade logic placed in another function.

// TODO: Should "bought" just remove the upgrade?

var upgrades = {
  "ramUpgrade": {
    "name": "RAM Upgrade",
    "target": "a",
    "bought": false,
    "cost": 5,
    "upAmount": 2
  }
}

function buyBuilding(building) {
  var amount = buildings[building][0];
  var initCost = buildings[building][1];
  var cost = Math.floor(initCost * Math.pow(1.1, amount));

  if (bytes >= cost) {
    buildings[building][0] += 1;
    bytes -= cost;
    // $("#bytes").text(bytes);
  }
}

function buyUpgrade(upgrade) {
  if (upgrades[upgrade].bought === false && buildings[upgrades[upgrade].target][0] > 0) {
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
    bps += value[0] * value[2];
  });
  // console.log(bps);
}

function updateScreen(ups) {
  // NOTE: ups = updates per second
  bytes += bps / ups;

  // console.log(bytes);

  var numSuffix = Math.floor(Math.log(bytes) / Math.log(1000));
  numSuffix = numSuffix < 0 ? 0 : numSuffix;
  var bySuffix = numSuffix <= suffix.length ? suffix[numSuffix] : suffix[suffix.length - 1];

  $("#bytes").text((bytes / (Math.pow(1000, numSuffix) >= 1 ? Math.pow(1000, numSuffix) : 1)).toFixedDown(numSuffix === 0 ? 0 : 3));
  $("#unit").text(bySuffix);
}

window.setInterval(function() {
  bpsCalc();
  updateScreen(30);
  // bytes += bps;
}, 1000/30);

/*
window.setInterval(function () {
  TODO: communicate w/ server
}, 1000);
*/
