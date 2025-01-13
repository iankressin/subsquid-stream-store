import { Worker, Job, type ConnectionOptions } from "bullmq";

export class RedisConsumer {
  private worker?: Worker;

  constructor(private queueName: string) {}

  async init(cb: (job: Job) => void) {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        try {
          console.log(`Processing job ${job.name}:`, job.data);

          cb(job);
        } catch (error) {
          console.error(`Error processing job ${job.name}:`, error);
          throw error;
        }
      },
      {
        connection: this.getConnection(),
      }
    );
  }

  private getConnection(): ConnectionOptions {
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
}
