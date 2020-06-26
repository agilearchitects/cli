export interface IInterfaceModule {
  question(query: string, callback: (answer: string) => void): void;
  close(): void;
}

export interface IReadlineModule {
  createInterface(input: NodeJS.ReadableStream, output?: NodeJS.WritableStream): IInterfaceModule
}

export interface IConsoleModule {
  log(message?: any, ...optionalParams: any[]): void;
  table(tabularData: any, properties?: string[]): void;
}

export interface IProcessModule {
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
  argv: string[];
}

export type prompt = (question: string) => Promise<string>;
export type commandCallback = () => void | Promise<void>;
export interface ICommand {
  name: string;
  callback: commandCallback;
  info?: string;
  man?: string;
}
export interface IArguments {
  [key: string]: string | number | boolean;
}

enum consoleColor {
  RESET = "\x1b[0m",
  BRIGHT = "\x1b[1m",
  DIM = "\x1b[2m",
  UNDERSCORE = "\x1b[4m",
  B_LINK = "\x1b[5m",
  REVERSE = "\x1b[7m",
  HIDDEN = "\x1b[8m",
  FG_BLACK = "\x1b[30m",
  FG_RED = "\x1b[31m",
  FG_GREEN = "\x1b[32m",
  FG_YELLOW = "\x1b[33m",
  FG_BLUE = "\x1b[34m",
  FG_MAGENTA = "\x1b[35m",
  FG_CYAN = "\x1b[36m",
  FG_WHITE = "\x1b[37m",
  BG_BLACK = "\x1b[40m",
  BG_RED = "\x1b[41m",
  BG_GREEN = "\x1b[42m",
  BG_YELLOW = "\x1b[43m",
  BG_BLUE = "\x1b[44m",
  BG_MAGENTA = "\x1b[45m",
  BG_CYAN = "\x1b[46m",
  BG_WHITE = "\x1b[47m",
}

export class CliModule {
  private commands: ICommand[] = [];
  private commandName: string | undefined;
  private _argumentDictionary: IArguments = {};
  private _argumentList: string[] = [];

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

    /* Parse out commands from process.argv. First two
    args are process name and file executed. These will
    be parsed out */
    const args: string[] = this.processModule.argv.slice(2);

    // Register command arguments
    this.commandName = args[0];
    this._argumentList = args.slice(1);
    this._argumentDictionary = args.slice(1).reduce((previousValue: IArguments, currentValue: string) => {
      let key: string = currentValue;
      let value: string | number | boolean = true;
      const match = currentValue.match(/^([^=]+)=(.*)$/);
      if (match !== null) {
        key = match[1];
        value = match[2];

        if (value.toLowerCase() === "true") {
          value = true;
        } else if (value.toLowerCase() === "false") {
          value = false;
        } else if (value === parseInt(value, 10).toString()) {
          value = parseInt(value, 10);
        }
      }
      return {
        ...previousValue,
        [key]: value,
      }
    }, {});
  }

  public get argumentDictionary(): IArguments { return this._argumentDictionary; }
  public get argumentList(): string[] { return this._argumentList; }

  public register(commandName: string, callback: commandCallback, info?: string, man?: string): this {
    if (this.getCommand(commandName) !== undefined) {
      throw new Error(`Command "${commandName}" is already registered`);
    }

    this.addCommand(commandName, callback, info, man);

    return this;
  }

  public async invoke(): Promise<void> {
    if (this.commandName === undefined) {
      this.print("No command was specifed");
      return;
    }
    const command = this.getCommand(this.commandName);
    if (command === undefined) {
      this.print(`Command "${this.commandName}" could not be found`);
      return;
    }

    const execution: void | Promise<void> = command.callback();
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

  public print(message: string): void {
    this.consoleModule.log(message);
  }

  public table(object: any, properties?: string[]): void {
    this.consoleModule.table(object, properties);
  }

  public error(message: string): void {
    this.consoleModule.log(consoleColor.FG_RED, message, consoleColor.RESET);
  }
  public success(message: string): void {
    this.consoleModule.log(consoleColor.FG_CYAN, message, consoleColor.RESET);
  }

  private getCommand(commandName: string): ICommand | undefined {
    return this.commands.find((command: ICommand) => command.name === commandName.toLowerCase());
  }
  private addCommand(commandName: string, callback: commandCallback, info?: string, man?: string): void {
    this.commands.push({ name: commandName.toLowerCase(), callback, info, man });
  }
}