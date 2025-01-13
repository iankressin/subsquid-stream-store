import { Entity } from "@subsquid/typeorm-store/lib/store";
import { connect, type Connection, type Channel } from "amqplib";
import { StreamAdaptor } from "./stream-adaptor";

export type RabbitMQPublishParams<E extends Entity> = {
  data: E[];
};

export class RabbitMQAdaptor<E extends Entity>
  implements StreamAdaptor<RabbitMQPublishParams<E>>
{
  private _connection?: Connection;
  private _channel?: Channel;

  constructor(private readonly queueName: string) {}

  public async connect() {
    if (this._connection && this._channel) {
      throw new Error("RabbitMQ: already initialized");
    }

    this._connection = await this.getRabbitMQConnection();
    this._channel = await this._connection.createChannel();
    await this.channel?.assertQueue(this.queueName);
  }

  public async publish(p: RabbitMQPublishParams<E>): Promise<void> {
    this.channel?.sendToQueue(this.queueName, this.entityToBuffer(p.data));
  }

  private entityToBuffer<E extends Entity>(e: E[]): Buffer {
    return Buffer.from(JSON.stringify(e));
  }

  private async getRabbitMQConnection(): Promise<Connection> {
    const rabbitmqUri = process.env.RABBITMQ_URI;
    if (!rabbitmqUri) throw new Error("RabbitMQ: RABBITMQ_URI is not set");
    return connect(rabbitmqUri);
  }

  private get channel(): Channel {
    if (!this._channel) throw new Error("RabbitMQ: not initialized");
    return this._channel;
  }
}
