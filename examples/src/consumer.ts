import { KafkaConsumer } from "./services/kafka-consumer";
import dotenv from "dotenv";
import { RedisConsumer } from "./services/redis-consumer";
import { RabbitMQConsumer } from "./services/rabbitmq-consumer";
import { QUEUE_NAME } from "./queue-config";
dotenv.config();

async function kafkaConsumer() {
  const kafkaConsumer = new KafkaConsumer(QUEUE_NAME); // Use the same queue name as in producer

  await kafkaConsumer.init();
  await kafkaConsumer.subscribe(QUEUE_NAME, (message) => {
    console.log("Kafka received message:", message);
  });
}

async function redisConsumer() {
  const redisConsumer = new RedisConsumer(QUEUE_NAME);
  await redisConsumer.init((job) => {
    console.log("Redis received message:", job.data);
  });
}

async function rabbitmqConsumer() {
  const rabbitmqConsumer = new RabbitMQConsumer();
  await rabbitmqConsumer.init();
  await rabbitmqConsumer.consume(QUEUE_NAME, (message) => {
    console.log("RabbitMQ received message:", message);
  });
}

rabbitmqConsumer()
  .then(() => {
    console.log("Consumer started");
  })
  .catch((error) => {
    console.error("Consumer failed to start", error);
  });
