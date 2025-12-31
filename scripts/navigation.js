const { applyDatatables } = require('./datatables');
const { updateRouteInfo } = require('./data');

const applyBindings = ko.observable(false);

$('document').off('ready');
$(document).ready(() => {

  ko.applyBindings({}, document.getElementById('nav-bar'));
  ko.applyBindings({}, document.getElementById('settings-modal'));
  ko.applyBindings({}, document.getElementById('questStepClearedModal'));

  applyBindings.subscribe((v) => {
    // Unbind and re-bind knockout
    if (v) {
      applyBindings(false);
      ko.cleanNode(document.getElementById('wiki-page-content'));
      ko.applyBindings({}, document.getElementById('wiki-page-content'));
      applyDatatables();
    }
  });

  updateRouteInfo();

  const pageElement = $('#wiki-page-content');
  $.get("./pages/region.html", (data) => {
    pageElement.html(data);
    applyBindings(true);
  })
});
