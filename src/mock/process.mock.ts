import { ReadStream, WriteStream } from "tty";
import { IProcessModule } from "../modules/cli.module";

export class ProcessMock implements IProcessModule {
  public stdin: NodeJS.ReadStream = new ReadStream(1);
  public stdout: NodeJS.WriteStream = new WriteStream(1);

  public constructor(
    public readonly argv: string[] = [],
  ) {
    this.stdin.destroy();
    this.stdout.destroy();
  }
}