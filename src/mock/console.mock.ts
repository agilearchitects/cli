import { IConsoleModule } from "../modules/cli.module";

export class ConsoleMock implements IConsoleModule {
  public constructor(
    private readonly logCallback: (message: string) => void
  ) { }

  public log(message?: any): void {
    this.logCallback(message);
  }
  public table(tabularData: any): void {
    this.logCallback(tabularData);
  }
}