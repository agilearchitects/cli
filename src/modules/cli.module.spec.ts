// Libs
import { expect } from "chai";
import { describe, it } from "mocha";
import * as readline from "readline";

// Modules
import { CliModule, IArguments } from "./cli.module";

// Mock
import { ReadlineMock } from "../mock/readline.mock";
import { ProcessMock } from "../mock/process.mock";
import { ConsoleMock } from "../mock/console.mock";

describe("CliService", () => {
  it("Should be able create", () => {
    const cli = new CliModule(readline, process, console);
    expect(cli).instanceOf(CliModule);
  });
  it("Should be able to register command", () => {
    const cli = new CliModule(readline, process, console);
    cli.register("my-command", () => { });
    expect(true);
  });
  it("Should be able to invoke", async () => {
    // Create mock console for listening on console.log
    const consoleMock = new ConsoleMock((data) => {
      // Make sure anything logged to console is not undefined
      expect(data).not.undefined;
    });
    const cli = new CliModule(readline, process, consoleMock);
    await cli.invoke();
  });
  it("Should be able to invoke specific command", async () => {
    // Specify output of command
    const output: string = "foobar";
    const commandName: string = "testcommand";
    // Create mock console for listening on console.log
    const consoleMock = new ConsoleMock((data: string) => {
      // Check that log output equals output string
      expect(data).equal(output);
    });
    // Create mock process invoking testcommand
    const processMock = new ProcessMock(["", "", commandName]);
    const cli = new CliModule(readline, processMock, consoleMock);
    // Register command which simply print output string (to console)
    cli.register(commandName, () => cli.print(output));
    // Invoke cli
    await cli.invoke();
  });
  it("Should be able prompt user for input", async () => {
    const answer = "foobar";
    // Create mock readline module
    const readlineMock = new ReadlineMock(answer);
    const cli = new CliModule(readlineMock, process, console);
    // Call prompt
    const promtAnswer = await cli.prompt("");
    expect(promtAnswer).equal(answer);
  });
  it("Should be able to parse argument values", async () => {
    const processMock = new ProcessMock(["", "", "testcommand",
      "a=b", // String value
      "foo=bar=hello", // String value with "=" sign
      "length=12", // Numeric value
      "test", // No value (parsed to true)
      "hello=true", // Boolean value
      "world=false", // Boolean value
      "c=c", "c=d" // Overwriting
    ]);
    const cli = new CliModule(readline, processMock, console);
    await cli.register("testcommand", () => {
      expect(cli.argumentDictionary["a"]).equal("b");
      expect(cli.argumentDictionary["foo"]).equal("bar=hello");
      expect(cli.argumentDictionary["length"]).equal(12);
      expect(cli.argumentDictionary["test"]).equal(true);
      expect(cli.argumentDictionary["hello"]).equal(true);
      expect(cli.argumentDictionary["world"]).equal(false);
      expect(cli.argumentDictionary["c"]).equal("d");
      expect(cli.argumentList).length(8);
    }).invoke();
  });
});