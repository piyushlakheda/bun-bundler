import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { parseModule } from 'esprima';
import { generate } from 'escodegen';

let moduleCache = new Map();
let visitedFiles = new Set();
let dependencyGraph = new Map();
let currentStack = [];

function parseCode(filePath) {
    try {
        const code = readFileSync(filePath, 'utf-8');
        return code;
    } catch (error) {
        console.error(`Error reading file: ${filePath}`);
        console.error(error);
        return ''; 
    }
}

function transformImportsAndExports(ast) {
    ast.body.forEach((node, index) => {
        if (node.type === 'ImportDeclaration') {
            const varName = node.specifiers[0].local.name;
            const modulePath = node.source.value;
            ast.body[index] = {
                type: 'VariableDeclaration',
                declarations: [{
                    type: 'VariableDeclarator',
                    id: { type: 'Identifier', name: varName },
                    init: {
                        type: 'MemberExpression',
                        computed: false,
                        object: {
                            type: 'CallExpression',
                            callee: { type: 'Identifier', name: 'require' },
                            arguments: [{ type: 'Literal', value: modulePath }]
                        },
                        property: { type: 'Identifier', name: 'default' }
                    }
                }],
                kind: 'const'
            };
        }
        if (node.type === 'ExportDefaultDeclaration') {
            const declaration = node.declaration;
            ast.body[index] = {
                type: 'ExpressionStatement',
                expression: {
                    type: 'AssignmentExpression',
                    operator: '=',
                    left: {
                        type: 'MemberExpression',
                        computed: false,
                        object: { type: 'Identifier', name: 'module.exports' },
                        property: { type: 'Identifier', name: 'default' }
                    },
                    right: declaration
                }
            };
        }
    });
    return ast;
}

function extractDependencies(ast) {
    const dependencies = [];
    ast.body.forEach(node => {
        if (node.type === 'ImportDeclaration') {
            dependencies.push(node.source.value);
        } else if (node.type === 'VariableDeclaration') {
            node.declarations.forEach(declaration => {
                if (
                    declaration.init &&
                    declaration.init.type === 'CallExpression' &&
                    declaration.init.callee.name === 'require'
                ) {
                    dependencies.push(declaration.init.arguments[0].value);
                }
            });
        } else if (node.type === 'ExpressionStatement' &&
                   node.expression.type === 'CallExpression' &&
                   node.expression.callee.name === 'require') {
            dependencies.push(node.expression.arguments[0].value);
        }
    });
    return dependencies;
}

function resolveDependencies(filePath, baseDir) {
    const absolutePath = resolve(baseDir, filePath);
    if (visitedFiles.has(absolutePath)) return;

    visitedFiles.add(absolutePath);
    currentStack.push(absolutePath);
    dependencyGraph.set(absolutePath, new Set());

    let code = parseCode(absolutePath);
    if (!code) return; // Handle missing files

    let ast;
    try {
        ast = parseModule(code, { jsx: true, tolerant: true });
    } catch (error) {
        console.error(`Error parsing AST for file: ${absolutePath}`);
        console.error(error);
        return; // Handle malformed files
    }

    const transformedAst = transformImportsAndExports(ast);
    const transformedCode = generate(transformedAst);
    const dir = dirname(absolutePath);

    const dependencies = extractDependencies(transformedAst);

    dependencies.forEach(dependencyPath => {
        if (!dependencyPath.startsWith('.')) return; // Skip external dependencies

        let resolvedPath = resolve(dir, dependencyPath + (extname(dependencyPath) ? '' : '.js'));
        dependencyGraph.get(absolutePath).add(resolvedPath);

        if (currentStack.includes(resolvedPath)) {
            console.warn(`Circular dependency detected: ${currentStack.join(' -> ')} -> ${resolvedPath}`);
            return;
        }

        resolveDependencies(resolvedPath, baseDir);
    });

    currentStack.pop();

    moduleCache.set(absolutePath, transformedCode);
}

function bundle(entryFile, outputFile) {
    resolveDependencies(entryFile, dirname(entryFile));

    let bundledCode = '';

    dependencyGraph.forEach((_, filePath) => {
        const wrappedCode = `
            // Submission by PIYUSH LAKHEDA
            //For info about edge cases refer README.md
            (function(exports, require, module, __filename, __dirname) {
                ${moduleCache.get(filePath)}
            })(module.exports, require, module, __filename, __dirname);
        `;
        bundledCode += wrappedCode;
    });

    writeFileSync(outputFile, bundledCode, 'utf-8');
    console.log(`Bundled to ${outputFile}`);
}

const entryFile = './index.js'; 
const outputFile = './dist/bundle.js'; 
bundle(entryFile, outputFile);
