const { applyDatatables } = require('../pokeclicker-wiki/scripts/datatables')

function mergeGridCells() {
    var dimension_col = 0;

    $('.table:has(thead)').each((_, element) => {
        var first_instance = null;
        var rowspan = 1;

        $(element).find('tr').each(function () {

            // find the td of the correct column (determined by the dimension_col set above)
            var dimension_td = $(this).find(`td:nth-child(${dimension_col + 1})`);

            if(!dimension_td) {
                return;
            }

            if (first_instance == null) {
                // must be the first row
                first_instance = dimension_td;
            } else if (dimension_td.text() == first_instance.text()) {
                // the current td is identical to the previous
                // remove the current td
                dimension_td.remove();
                // increment the rowspan attribute of the first instance
                first_instance.attr('rowspan', ++rowspan);
            } else {
                // this cell is different from the last
                first_instance = dimension_td;
                rowspan = 1;
            }
        })
    })
    //         var dimension_cells = new Array();
    //         var dimension_col = null;
    //         var columnCount = $(element, "tr:first th").length;

    // console.log(columnCount)

    //         for (dimension_col = 0; dimension_col < columnCount; dimension_col++) {
    //             // first_instance holds the first instance of identical td
    //             var first_instance = null;
    //             var rowspan = 1;
    //             // iterate through rows
    //             $("#example").find('tr').each(function () {

    //                 // find the td of the correct column (determined by the dimension_col set above)
    //                 var dimension_td = $(this).find('td:nth-child(' + dimension_col + ')');

    //                 if (first_instance == null) {
    //                     // must be the first row
    //                     first_instance = dimension_td;
    //                 } else if (dimension_td.text() == first_instance.text()) {
    //                     // the current td is identical to the previous
    //                     // remove the current td
    //                     dimension_td.remove();
    //                     ++rowspan;
    //                     // increment the rowspan attribute of the first instance
    //                     first_instance.attr('rowspan', rowspan);
    //                 } else {
    //                     // this cell is different from the last
    //                     first_instance = dimension_td;
    //                     rowspan = 1;
    //                 }
    //             });
    //         }
    //     })
}

module.exports = {
    applyDatatables: function () {
        applyDatatables();
        mergeGridCells();
    },
}
