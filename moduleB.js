const moduleA = require('./moduleA');

export default function() {
    console.log("Module B loaded");
    moduleA(); // Introducing the circular dependency
}
