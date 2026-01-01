function applyDatatables() {
    // Any table with headers
    $('.table:has(thead)').each((i, element) => {
    try {
        const rows = element.getElementsByTagName('tr').length;
        // Don't process these as datatables cannot handle them
        const doNotProcess = element.querySelectorAll('[colspan],[rowspan],.no-data-tables').length || element.classList.contains('no-data-tables');

        // Don't process anything with less than 40 rows
        if (doNotProcess) return;

        // Bootstrap style tables, with responsive table
        let dom = `<'row'<'col-sm-12 col-md-6'i><'col-sm-12 col-md-6'p>><'row table-responsive'<'col-sm-12'tr>>`;
        // How many items per page
        let pageLength = 20;

        // If we have less than 40 rows, we don't need pagination, but table will still be sortable
        if (rows < 40) {
            pageLength = 40;
            dom = `<'row'<'col-sm-12 col-md-6'><'col-sm-12 col-md-6'>><'row table-responsive'<'col-sm-12'tr>>`
        }

        $(element).DataTable({
            // Remember page/search/order
            stateSave: true,
            dom,
            pageLength,
            // Adjust text
            language: {
                paginate: {
                    previous: '←',
                    next: '→',
                }
            },
            searching:false,
            ordering:false,
            drawCallback: function() {
                mergeGridCells()
            }
        })
    } catch (e) { }
})
}

/* CUSTOM DATA TABLES STUFF */

// Hide any error messages that may appear (remove this line for debugging)
$.fn.dataTable.ext.errMode = 'none';

// Adjust how page numbers are shown
$.fn.DataTable.ext.pager.simple_numbers_no_ellipses = (page, pages) => {
    // how many buttons total (excluding next/prev buttons)
    const buttons = 5; // Limit to 5 so it should be fine on mobile
    const half = Math.floor( buttons / 2 );

    page = Math.max(0, page - half);
    const count = Math.min(pages - page, buttons);
    const numbers = [];
    for (let i = 0; i < count; i++){
        numbers.push(page++);
    }

    numbers.DT_el = 'span';

    return [ 'previous', numbers, 'next' ];
};


function mergeGridCells() {
    var dimension_col = 0;

    $('.table:has(thead)').each((_, element) => {
        var first_instance = null;
        var rowspan = 1;

        $(element).find('tr').each(function () {

            // find the td of the correct column (determined by the dimension_col set above)
            var dimension_td = $(this).find(`td:nth-child(${dimension_col + 1})`);

            if (!dimension_td) {
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
}

module.exports = {
    applyDatatables,
    mergeGridCells
}
