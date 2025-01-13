import { ConnectionOptions, Queue } from "bullmq";
import { StreamAdaptor } from "./stream-adaptor";
import { Entity } from "@subsquid/typeorm-store/lib/store";

export type RedisPublishParams<E extends Entity> = {
  jobName: string;
  data: E[];
};

export class RedisAdaptor<E extends Entity>
  implements StreamAdaptor<RedisPublishParams<E>>
{
  private _queue?: Queue;

  constructor(private readonly queueName: string) {}

  public async connect(): Promise<void> {
    this._queue = new Queue(this.queueName, {
      connection: this.getRedisConnection(),
    });
  }

  public async publish(p: RedisPublishParams<E>): Promise<void> {
    await this.queue.add(p.jobName, p.data);
  }

  private getRedisConnection(): ConnectionOptions {
    if (!process.env.REDIS_HOST) {
      throw new Error("Redis: REDIS_HOST is not set");
    }

    if (!process.env.REDIS_PORT) {
      throw new Error("Redis: REDIS_PORT is not set");
    }

    return {
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    };
  }

  private get queue(): Queue {
    if (!this._queue) throw new Error("Redis: not initialized");
    return this._queue;
  }
}
