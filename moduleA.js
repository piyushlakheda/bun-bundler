const moduleB = require('./moduleB');

module.exports = function() {
    console.log("Module A loaded");
    moduleB(); // Introducing the circular dependency
};
