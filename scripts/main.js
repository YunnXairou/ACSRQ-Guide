// import our version etc
const package = require('../pokeclicker/package.json');

// pokeclicker-wiki/scripts/game break Requirement completion so we put it back
const oldComplete = Requirement.prototype.isCompleted 

window.Guide = {
    package,
    ...require('./datatables'),
    ...require('./manual'),
    ...require('../pokeclicker-wiki/scripts/game'),
    ...require('./guide'),
    ...require('./navigation'),
}

Requirement.prototype.isCompleted = oldComplete;