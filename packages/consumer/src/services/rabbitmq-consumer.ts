import { type Channel, type Connection, connect } from "amqplib";

export class RabbitMQConsumer {
  private _connection?: Connection;
  private _channel?: Channel;

  public async init() {
    this._connection = await this.getConnection();
    this._channel = await this.connection.createChannel();
  }

  private async getConnection(): Promise<Connection> {
    const rabbitmqUri = process.env.RABBITMQ_URI;
    if (!rabbitmqUri) throw new Error("RabbitMQ: RABBITMQ_URI is not set");
    return connect(rabbitmqUri);
  }

  public async consume(queue: string, callback: (message: string) => void) {
    return this.channel.consume(queue, (message) => {
      if (message) {
        callback(message.content.toString());
        this.channel.ack(message);
      } else {
      }
    });
  }

  public async close() {
    await this._channel?.close();
    await this._connection?.close();
  }

  private get connection(): Connection {
    if (!this._connection)
      throw new Error("RabbitMQ: connection not initialized");
    return this._connection;
  }

  private get channel(): Channel {
    if (!this._channel) throw new Error("RabbitMQ: channel not initialized");
    return this._channel;
  }
}
