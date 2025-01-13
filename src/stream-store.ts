import {
  FinalTxInfo,
  HashAndHeight,
} from "@subsquid/typeorm-store/lib/interfaces";
import { StreamAdaptor } from "./adaptors/stream-adaptor";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const HashAndHeightSchema = z.object({
  height: z.number(),
  hash: z.string(),
});

const initalStatus = {
  hash: "0x",
  height: -1,
};

const STATUS_FILE_NAME = "status.json";

/**
 * StreamStore is a class that manages the state of the stream processor.
 * It is used to store the current block hash and height, and to update the status file.
 */
export class StreamStore<
  PublishParams,
  Adaptor extends StreamAdaptor<PublishParams>
> {
  supportHotBlocks = false;

  constructor(private streamAdaptor: Adaptor) {}

  public async connect(): Promise<HashAndHeight> {
    const [status] = await Promise.all([
      this.readStatus(),
      this.streamAdaptor.connect(),
    ]);
    if (status) return status;

    await this.updateStatus(initalStatus);

    return initalStatus;
  }

  public async transact(
    info: FinalTxInfo,
    cb: (store: Adaptor) => Promise<void>
  ): Promise<void> {
    await this.updateStatus(info.nextHead);
    await cb(this.streamAdaptor);
  }

  private async updateStatus(status: HashAndHeight) {
    const statusFile = path.join(process.cwd(), STATUS_FILE_NAME);
    await fs.writeFile(statusFile, JSON.stringify(status, null, 2));
  }

  private async readStatus(): Promise<HashAndHeight | null> {
    const statusFile = path.join(process.cwd(), STATUS_FILE_NAME);
    const contents = await fs.readFile(statusFile, "utf-8").catch(() => null);
    if (!contents) return null;

    const parsed = HashAndHeightSchema.parse(JSON.parse(contents));
    return parsed;
  }
}
