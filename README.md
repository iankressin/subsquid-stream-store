# @subsquid/stream-store

This package is a library that allows you to stream decoded data from a squid to a message queue.

## Installation

```bash
npm install @subsquid/stream-store
```

## Usage

```ts
import { StreamStore, RabbitMQAdaptor } from "@subsquid/stream-store";

const streamStore = new StreamStore(new RabbitMQAdaptor("usdc-transfers"));

processor.run(streamStore, (ctx) => {
   ctx.store.publish({ data: /* Your decoded data */ });
});
```

For each adaptor, you need a different set of environment variables.

```sh
# RabbitMQ
RABBITMQ_URI=amqp://user:password@localhost:5672

# Kafka
KAFKA_BROKER_URI=localhost:29092

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Available Adaptors

- [RabbitMQ](src/adaptors/rabbitmq-adaptor.ts)
- [Kafka](src/adaptors/kafka-adaptor.ts)
- [Redis](src/adaptors/redis-adaptor.ts)

## Examples

You can check the usage examples in the [examples](examples) folder.

## Running examples

First, build the stream store package:

```bash
npm install
npm run build
```

Then, build the examples package:

```bash
cd examples/
npm install
npm run build
```

Create `.env` file in the `examples` folder with the environment variables.

```sh
cp .env.example .env
```

Start the services:

```bash
docker compose up
```

In two separate terminals, run the producer and consumer:

```bash
# Terminal 1
npm run examples:producer

# Terminal 2
npm run examples:consumer
```
