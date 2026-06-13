const expectedMajor = 24;
const currentVersion = process.versions.node;
const currentMajor = Number(currentVersion.split(".")[0]);

if (currentMajor !== expectedMajor) {
  console.error(
    JSON.stringify(
      {
        error: "Unsupported Node.js runtime",
        expected: `${expectedMajor}.x`,
        actual: currentVersion,
        help: "Use Node.js 24 before installing dependencies, building, or running validation."
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      node: currentVersion,
      policy: `${expectedMajor}.x`
    },
    null,
    2
  )
);
