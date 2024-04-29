// Libs
import { describe, expect, it } from "@jest/globals";
import * as readline from "readline";

// Modules
import { CliModule } from "./cli.module";

// Mock
import { ReadlineMock } from "../mock/readline.mock";
import { ProcessMock } from "../mock/process.mock";
import { ConsoleMock } from "../mock/console.mock";

describe("CliService", () => {
  it("Should be able create", () => {
    const cli = new CliModule(readline, process, console);
    expect(cli).toBeInstanceOf(CliModule);
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
      expect(data).not.toBeUndefined();
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
      expect(data).toEqual(output);
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
    expect(promtAnswer).toEqual(answer);
  });

  it("Should be able to parse arguments", async () => {
    const processMock = new ProcessMock(["", "", "testcommand", "a", "b"]);
    const cli = new CliModule(readline, processMock, console);
    await cli.register("testcommand", (a: string, b: string) => {
      expect(cli.argumentList).toEqual(["a", "b"]);
      expect(cli.argumentList).toHaveLength(2);
    }).invoke();
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
      expect(cli.argumentDictionary["a"]).toEqual("b");
      expect(cli.argumentDictionary["foo"]).toEqual("bar=hello");
      expect(cli.argumentDictionary["length"]).toEqual(12);
      expect(cli.argumentDictionary["test"]).toEqual(true);
      expect(cli.argumentDictionary["hello"]).toEqual(true);
      expect(cli.argumentDictionary["world"]).toEqual(false);
      expect(cli.argumentDictionary["c"]).toEqual("d");
      expect(cli.argumentList).toHaveLength(8);
    }).invoke();
  });
});