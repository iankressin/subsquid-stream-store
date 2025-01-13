# Stream Store Examples

This directory contains examples of how to use the `@subsquid/stream-store` package with different stream adaptors.

## USDC Transfer Example

The main example in `src/main.ts` shows how to track USDC transfers on Ethereum and publish them to a message queue using RabbitMQ.

### Using Different Stream Adaptors

The example uses RabbitMQ by default, but you can easily switch to other supported adaptors:

#### Using Kafka

```ts
const kafkaAdaptor = new KafkaAdaptor("usdc-transfers");
const streamStore = new StreamStore(kafkaAdaptor);

processor.run(streamStore, (ctx) => {
  // ...

  ctx.store.publish(/* ... */);
});
```

#### Using Redis

```ts
const redisAdaptor = new RedisAdaptor("usdc-transfers");
const streamStore = new StreamStore(redisAdaptor);

processor.run(streamStore, (ctx) => {
  // ...

  ctx.store.publish(/* ... */);
});
```

#### Using RabbitMQ

```ts
const rabbitmqAdaptor = new RabbitMQAdaptor("usdc-transfers");
const streamStore = new StreamStore(rabbitmqAdaptor);

processor.run(streamStore, (ctx) => {
  // ...

  ctx.store.publish(/* ... */);
});
```
