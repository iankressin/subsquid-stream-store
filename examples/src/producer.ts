import { EvmBatchProcessor } from "@subsquid/evm-processor";
import * as usdcAbi from "./abi/usdc";
import { UsdcTransfer } from "./model";
import { RabbitMQAdaptor, StreamStore } from "@subsquid/stream-store";
import { QUEUE_NAME } from "./queue-config";

const USDC_CONTRACT_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

const processor = new EvmBatchProcessor()
  .setGateway("https://v2.archive.subsquid.io/network/ethereum-mainnet")
  .setRpcEndpoint("https://rpc.ankr.com/eth")
  .setFinalityConfirmation(75)
  .addLog({
    range: { from: 6_082_465 },
    address: [USDC_CONTRACT_ADDRESS],
    topic0: [usdcAbi.events.Transfer.topic],
  })
  .setFields({
    log: {
      transactionHash: true,
    },
  });

/**
 * In order to use other stream adaptor, you can simply instantiate it and pass it to the StreamStore
 * For example, to use KafkaAdaptor, you can do the following:
 * ```ts
 * import { KafkaAdaptor } from "@subsquid/stream-store";
 * const kafkaAdaptor = new KafkaAdaptor("usdc-transfers");
 * const streamStore = new StreamStore(kafkaAdaptor);
 * ```
 *
 * or RedisAdaptor:
 * ```ts
 * import { RedisAdaptor } from "@subsquid/stream-store";
 * const redisAdaptor = new RedisAdaptor(QUEUE_NAME);
 * const streamStore = new StreamStore(redisAdaptor);
 * ```
 */
const rabbitmqAdaptor = new RabbitMQAdaptor(QUEUE_NAME);
const streamStore = new StreamStore(rabbitmqAdaptor);

processor.run(streamStore, async (ctx) => {
  const transfers: UsdcTransfer[] = [];

  for (let block of ctx.blocks) {
    for (let log of block.logs) {
      if (
        log.address === USDC_CONTRACT_ADDRESS &&
        log.topics[0] === usdcAbi.events.Transfer.topic
      ) {
        let { from, to, value } = usdcAbi.events.Transfer.decode(log);
        transfers.push(
          new UsdcTransfer({
            id: log.id,
            block: block.header.height,
            from,
            to,
            value,
            txnHash: log.transactionHash,
          })
        );
      }
    }
  }

  /**
   * Publish the transfers to the stream store
   */
  await ctx.store.publish({
    data: transfers,
  });
});
