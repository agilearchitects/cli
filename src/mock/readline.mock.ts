import { IReadlineModule, IInterfaceModule } from "../modules/cli.module";

export class ReadlineMock implements IReadlineModule {
  public constructor(
    private answerResponse: string,
  ) { }
  public createInterface(input: NodeJS.ReadableStream, output?: NodeJS.WritableStream): IInterfaceModule {
    return {
      question: (query: string, callback: (answer: string) => void): void => {
        callback(this.answerResponse);
      },
      close: (): void => { }
    }
  }
}