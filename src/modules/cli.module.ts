export interface IInterfaceModule {
  question(query: string, callback: (answer: string) => void): void;
  close(): void;
}

export interface IReadlineModule {
  createInterface(input: NodeJS.ReadableStream, output?: NodeJS.WritableStream): IInterfaceModule
}

export interface IConsoleModule {
  log(message?: any): void;
  table(tabularData: any, properties?: string[]): void;
}

export interface IProcessModule {
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
  argv: string[];
}

export type prompt = (question: string) => Promise<string>;
export type commandCallback = (...args: string[]) => void | Promise<void>;
export interface ICommand {
  name: string;
  callback: commandCallback;
  info?: string;
  man?: string;
}

export class CliModule {
  private commands: ICommand[] = [];

  public constructor(
    private readonly readlineModule: IReadlineModule,
    private readonly processModule: IProcessModule,
    private readonly consoleModule: IConsoleModule,
  ) {
    this.register("help", () => {
      const tabs = "\t\t\t";
      consoleModule.log(`COMMAND${tabs}INFO\n${this.commands.map((command: ICommand) =>
        `${command.name}${command.info !== undefined ? `${tabs}${command.info}` : ""}`).join("\n")}`);
    }, "Print this text");
  }

  public register(commandName: string, callback: commandCallback, info?: string, man?: string): this {
    if (this.getCommand(commandName) !== undefined) {
      throw new Error(`Command "${commandName}" is already registered`);
    }

    this.addCommand(commandName, callback, info, man);

    return this;
  }

  public async invoke(): Promise<void> {
    /* Parse out commands from process.argv. First two
    args are process name and file executed. These will
    be parsed out */
    const args: string[] = this.processModule.argv.slice(2);

    // Will throw error if command is missing from args
    if (args[0] === undefined) {
      this.consoleModule.log("No command was specifed");
      return;
    }

    // Get command
    const command = this.getCommand(args[0]);

    // Will throw error if command could not be found
    if (command === undefined) {
      this.consoleModule.log(`Command "${args[0]}" could not be found`);
      return;
    }

    const execution: void | Promise<void> = command.callback(...args.slice(1));
    if (execution instanceof Promise) {
      await execution;
    }
  }

  public async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = this.readlineModule.createInterface(
        this.processModule.stdin,
        this.processModule.stdout
      );
      rl.question(question, (answer: string) => {
        // Close interface
        rl.close();
        // Resolve interface
        resolve(answer);
      });
    });
  }

  public print(string: string): void {
    this.consoleModule.log(string);
  }

  public table(object: any, properties?: string[]): void {
    this.consoleModule.table(object, properties);
  }

  private getCommand(commandName: string): ICommand | undefined {
    return this.commands.find((command: ICommand) => command.name === commandName.toLowerCase());
  }
  private addCommand(commandName: string, callback: commandCallback, info?: string, man?: string): void {
    this.commands.push({ name: commandName.toLowerCase(), callback, info, man });
  }
}