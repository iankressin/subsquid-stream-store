import { Worker, Job, type ConnectionOptions } from "bullmq";

export class RedisConsumer {
  private worker?: Worker;

  constructor(private queueName: string) {}

  async init() {
    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        try {
          console.log(`Processing job ${job.name}:`, job.data);

          return true;
        } catch (error) {
          console.error(`Error processing job ${job.name}:`, error);
          throw error;
        }
      },
      {
        connection: this.getConnection(),
      }
    );

    this.worker.on("completed", (job) => {
      console.log(`Job ${job.name} completed`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`Job ${job?.name} failed:`, err);
    });
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
