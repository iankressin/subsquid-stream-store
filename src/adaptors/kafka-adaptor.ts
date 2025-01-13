import { Entity } from "@subsquid/typeorm-store/lib/store";
import { StreamAdaptor } from "./stream-adaptor";
import { Kafka, Producer } from "kafkajs";

export type KafkaPublishParams<E extends Entity> = {
  data: E[];
};

export class KafkaAdaptor<E extends Entity> extends StreamAdaptor<
  KafkaPublishParams<E>
> {
  private _kafka?: Kafka;
  private _producer?: Producer;

  constructor(private readonly queueName: string) {
    super();
    this._kafka = this.getKakfaInstance();
  }

  public async connect(): Promise<void> {
    this._producer = this.kafka.producer();
    await this._producer.connect();
  }

  public async publish(p: KafkaPublishParams<E>): Promise<void> {
    await this.producer.send({
      topic: this.queueName,
      messages: p.data.map((e) => ({ value: JSON.stringify(e) })),
    });
  }

  public async batchPublish(p: KafkaPublishParams<E>[]) {
    await this.producer.sendBatch({
      topicMessages: p.map((e) => ({
        topic: this.queueName,
        messages: e.data.map((d) => ({ value: JSON.stringify(d) })),
      })),
    });
  }

  private get kafka(): Kafka {
    if (!this._kafka) {
      throw new Error("KafkaAdaptor: Kafka instance is not set");
    }

    return this._kafka;
  }

  private get producer(): Producer {
    if (!this._producer) {
      throw new Error("KafkaAdaptor: Producer instance is not set");
    }

    return this._producer;
  }

  private getKakfaInstance(): Kafka {
    const kafkaBrokerUri = process.env.KAFKA_BROKER_URI;

    if (!kafkaBrokerUri) {
      throw new Error("KafkaAdaptor: KAFKA_BROKER_URI is not set");
    }

    return new Kafka({
      clientId: this.queueName,
      brokers: [kafkaBrokerUri],
    });
  }
}
