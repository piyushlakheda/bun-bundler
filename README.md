# dyte

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.js
```

This project was created using `bun init` in bun v1.1.8. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.


`EDGE CASES WHICH THIS BUNDLER WILL HANDLE ARE`
 
`Missing Files`: When a file cannot be found at the specified path, the bundler detects the error while attempting to read the file. Instead of crashing, it handles the situation gracefully by logging an error message and moving forward with an empty string. This approach prevents the bundler from halting due to missing files.

`Empty Files`: Prior to parsing a file, the bundler verifies whether the file contains any content. If the file is empty, parsing is skipped, and the bundler proceeds with an empty string. This precautionary measure prevents potential errors that may arise from parsing empty files.

`Malformed Files`: If a file contains syntax errors or other issues that hinder parsing of the JavaScript code, the bundler identifies the problem and captures the parsing error. Rather than stopping, it manages the error by logging an error message. Consequently, the bundler continues processing other files without being disrupted by malformed ones.

`Duplicate Dependencies`: To enhance efficiency and prevent redundancy, the bundler ensures that each dependency is processed only once. It accomplishes this by employing a Set to keep track of visited files. By avoiding multiple processing of the same file, the bundler operates more efficiently and mitigates potential complications associated with duplicate code in the output bundle.