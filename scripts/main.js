// import our version etc
const package = require('../pokeclicker/package.json');

window.Guide = {
    package,
    ...require('./datatables'),
    ...require('../pokeclicker-wiki/scripts/game'),
    ...require('./data'),
    ...require('./navigation'),
}
