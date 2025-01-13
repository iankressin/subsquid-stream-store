import { KafkaConsumer } from "./services/kafka-consumer";
import dotenv from "dotenv";
import { RabbitMQConsumer } from "./services/rabbitmq-consumer";

dotenv.config();

async function main() {
  const rabbitmqConsumer = new RabbitMQConsumer();

  await rabbitmqConsumer.init();

  await rabbitmqConsumer.consume("usdcTransfers", (message) => {
    console.log("Received message:", message);
  });
}

main()
  .then(() => {
    console.log("Consumer started");
  })
  .catch((error) => {
    console.error("Consumer failed to start", error);
  });
