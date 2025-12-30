const { applyDatatables } = require('./datatables');

const applyBindings = ko.observable(false);

$('document').off('ready');
$(document).ready(() => {
  ko.applyBindings({}, document.getElementById('nav-bar'));
  ko.applyBindings({}, document.getElementById('settings-modal'));

  applyBindings.subscribe((v) => {
    // Unbind and re-bind knockout
    if (v) {
      applyBindings(false);
      ko.cleanNode(document.getElementById('wiki-page-content'));
      ko.applyBindings({}, document.getElementById('wiki-page-content'));
      applyDatatables();
    }
  });


  const pageElement = $('#wiki-page-content');
  $.get("./pages/region.html", (data) => {
    pageElement.html(data);
    applyBindings(true);
  })

});
