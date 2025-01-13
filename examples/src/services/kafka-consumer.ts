import { Kafka, type Consumer, type EachMessagePayload } from "kafkajs";

export class KafkaConsumer {
  private _kafka?: Kafka;
  private _consumer?: Consumer;

  constructor(private readonly groupId: string) {
    this._kafka = this.getKafkaInstance();
  }

  public async init() {
    this._consumer = this.kafka.consumer({ groupId: this.groupId });
    await this._consumer.connect();
  }

  public async subscribe(topic: string, callback: (message: string) => void) {
    await this.consumer.subscribe({ topic });

    await this.consumer.run({
      eachMessage: async ({ message }: EachMessagePayload) => {
        if (message.value) {
          callback(message.value.toString());
        }
      },
    });
  }

  public async close() {
    await this._consumer?.disconnect();
  }

  private get kafka(): Kafka {
    if (!this._kafka) {
      throw new Error("KafkaConsumer: Kafka instance is not set");
    }
    return this._kafka;
  }

  private get consumer(): Consumer {
    if (!this._consumer) {
      throw new Error("KafkaConsumer: Consumer instance is not set");
    }
    return this._consumer;
  }

  private getKafkaInstance(): Kafka {
    const kafkaBrokerUri = process.env.KAFKA_BROKER_URI;

    if (!kafkaBrokerUri) {
      throw new Error("KafkaConsumer: KAFKA_BROKER_URI is not set");
    }

    return new Kafka({
      clientId: `consumer-${this.groupId}`,
      brokers: [kafkaBrokerUri],
    });
  }
}
