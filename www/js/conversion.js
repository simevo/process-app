// configuration for jshint
/* jshint browser: true, devel: true, strict: true */
/* global ko */

function unit_list(units) {
  "use strict";
  var dimensions = [
    {"€": 1.0, "$": 0.7351, "£": 1.229, "¥": 7.226E-3},
    {"m": 1.0, "mm": 0.001, "cm": 0.01, "ft": 0.3048, "in": 0.0254, "yd": 0.9144, "mi": 1609.344, "km": 1000.0},
    {"m^2": 1.0, "ft2": 0.3048*0.3048, "mi2": 1609.344*1609.344, "km2": 1000.0*1000.0, "ha": 10000.0},
    {"m^3": 1.0, "ft3": 0.3048*0.3048*0.3048, "dm3": 0.001, "l": 0.001, "gal": 3.785411784E-3 },
    {"kg s^-1": 1.0, "kg/h": 1.0/3600.0, "lb/h": 0.4535924 / 3600.0, "kg/d": 1.0 / 3600 / 24.0, "g/d": 1.0 / 3600 / 24.0 / 1000.0, "t/h": 1000.0 / 3600.0, "t/d": 1000.0 / 3600.0 / 24.0, "t/yr": 1000.0 / 3600.0 / 24.0 / 365.2421},
    {"m^-3 kg": 1.0, "kg/m3": 1.0, "lb/ft3": 0.4535924 / (0.3048 * 0.3048 * 0.3048)},
    {"m^3 s^-1": 1.0, "m3/h": 1.0/3600.0, "ft3/h": 0.3048 * 0.3048 * 0.3048 / 3600.0},
    {"kmol s^-1": 1.0, "kmol/h": 1.0/3600.0, "lbmol/h": 0.4535924 / 3600.0},
    {"kmol^-1 m^3": 1.0, "kmol/m3": 1.0, "lbmol/ft3": 0.4535924 / (0.3048 * 0.3048 * 0.3048)},
    {"m^-1 kg s^-2": 1.0, "atm": 101325.0, "psi": 101325.0 / 14.6959487755},
    {"m^2 kg s^-3": 1.0, "kW": 1000.0, "mmBTU": 1055.05585262E6}];
  var ul = {};
  dimensions.some(function(dimension) {
    if (units in dimension) {
      ul = dimension;
      return true;
    }
  });
  ul[units] = 1.0;
  return ul;
}

function conversionViewModel(params) {
  "use strict";
  /* jshint validthis: true */
  this.unit_list = ko.observable(unit_list(params.units()));
  this.value = params.value;
  this.units =  params.units;
  this.display = ko.pureComputed({
    read: function () {
      // convert value to unit from base unit
      return this.value() / this.unit_list()[this.units()];
    },
    write: function (v) {
      // convert value from unit to base unit
      this.value(v * this.unit_list()[this.units()]);
    },
    owner: this
  });
}

ko.components.register('conversion-widget-readonly', {
  viewModel: conversionViewModel,
  template: { element: 'conversion-widget-readonly-template' }
});
