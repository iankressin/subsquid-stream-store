import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";
import {
  HashAndHeight,
  HotTxInfo,
} from "@subsquid/typeorm-store/lib/interfaces";
import { StreamAdaptor } from "./adaptors";
import assert from "assert";

const HashAndHeightSchema = z.object({
  height: z.number(),
  hash: z.string(),
});

const HotDatabaseStateSchema = HashAndHeightSchema.extend({
  top: HashAndHeightSchema.array(),
});

type HotDatabaseState = z.infer<typeof HotDatabaseStateSchema>;

const initalStatus = {
  hash: "0x",
  height: -1,
  top: [],
};

const STATUS_FILE_NAME = "status.json";

export class HotStreamStore<
  PublishParams,
  Adaptor extends StreamAdaptor<PublishParams>,
> {
  supportHotBlocks = true;

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
    info: HotTxInfo,
    cb: (store: Adaptor) => Promise<void>,
  ): Promise<void> {
    await this.updateStatus({
      ...(await this.readStatus()),
      ...info.finalizedHead,
    });
    await cb(this.streamAdaptor);
  }

  public transactHot(
    info: HotTxInfo,
    cb: (store: Adaptor, block: HashAndHeight) => Promise<void>,
  ): Promise<void> {
    return this.transactHot2(info, async (store, sliceBeg, sliceEnd) => {
      for (let i = sliceBeg; i < sliceEnd; i++) {
        await cb(store, info.newBlocks[i]);
      }
    });
  }

  public async transactHot2(
    info: HotTxInfo,
    cb: (
      store: Adaptor,
      blockSliceStart: number,
      blockSliceEnd: number,
    ) => Promise<void>,
  ): Promise<void> {
    let status = await this.readStatus();
    let chain = [status, ...status.top];
    const canonicalChainHead = info.baseHead.height;
    const hotBlocksNotInCanonicalChain =
      canonicalChainHead + 1 - chain[0].height;

    if (hotBlocksNotInCanonicalChain > 0) {
      // Inform consumers that a reorgs has happened and they should consider
      // they should rollback any calculations they made based on the hot blocks
      await this.streamAdaptor.publishRollback({
        oldHead: chain[-1],
        newHead: info.baseHead,
      });
    }

    let finalizedHeadPosition = info.finalizedHead.height - chain[0].height;
    let finalizedHeadEnd = finalizedHeadPosition + 1;
    if (finalizedHeadEnd > 0) {
      // Calls cb and passes the finalized blocks. Note that we're not inserting the
      // finalized blocks into the hot blocks array
      await cb(this.streamAdaptor, 0, finalizedHeadEnd);
    } else {
      finalizedHeadEnd = 0;
    }

    // For all the blocks that aren't part of the canonical chain yet, insert them
    // into the hot blocks array and call cb
    for (let i = finalizedHeadEnd; i < hotBlocksNotInCanonicalChain; i++) {
      await this.insertHotBlock(chain[i]);
      await cb(this.streamAdaptor, i, i + 1);
    }

    chain = chain.slice(0, hotBlocksNotInCanonicalChain).concat(info.newBlocks);

    assert(chain[finalizedHeadPosition].hash === info.finalizedHead.hash);
    await this.deleteHotBlocks(info.finalizedHead.height);

    status = await this.readStatus();
    await this.updateStatus({ ...status, ...info.finalizedHead });
  }

  private async insertHotBlock(block: HashAndHeight): Promise<void> {
    const status = await this.readStatus();
    status.top.push(block);
    await this.updateStatus(status);
  }

  private async deleteHotBlocks(finalizedHead: number): Promise<void> {
    const status = await this.readStatus();
    status.top = status.top.filter(block => block.height < finalizedHead);
    await this.updateStatus(status);
  }

  private async updateStatus(status: HotDatabaseState) {
    const statusFile = path.join(process.cwd(), STATUS_FILE_NAME);
    await fs.writeFile(statusFile, JSON.stringify(status, null, 2));
  }

  private async readStatus(): Promise<HotDatabaseState> {
    const statusFile = path.join(process.cwd(), STATUS_FILE_NAME);
    const contents = await fs.readFile(statusFile, "utf-8").catch(() => null);
    assert(contents, "Status file is empty or not found");
    return HotDatabaseStateSchema.parse(JSON.parse(contents));
  }
}
