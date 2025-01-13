import { EvmBatchProcessor } from "@subsquid/evm-processor";
import * as usdcAbi from "../abi/usdc";
import { RabbitMQAdaptor } from "../../../../stream/adaptors/rabbitmq.adaptor";
import { UsdcTransfer } from "../model";
import { StreamStore } from "../../../../stream";
import { KafkaAdaptor } from "../../../../stream/adaptors/kafka.adaptor";

const USDC_CONTRACT_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export class Subsquid {
  public async run() {
    if (!this.processor) {
      throw new Error("App not properly initialized");
    }

    this.processor.run(
      new StreamStore(new RabbitMQAdaptor("usdcTransfers")),
      async (ctx) => {
        const usdcTransfers: UsdcTransfer[] = [];

        for (const block of ctx.blocks) {
          for (const log of block.logs) {
            if (
              log.address === USDC_CONTRACT_ADDRESS &&
              log.topics[0] === usdcAbi.events.Transfer.topic
            ) {
              const { from, to, value } = usdcAbi.events.Transfer.decode(log);
              const transfer = new UsdcTransfer({
                id: log.id,
                block: block.header.height,
                from,
                to,
                value,
                txnHash: log.transaction?.hash,
              });

              usdcTransfers.push(transfer);
            }
          }
        }

        await ctx.store.publish({
          data: usdcTransfers,
        });
      }
    );
  }

  private get processor() {
    const sqdGateway = process.env.SQD_GATEWAY;
    const sqdRpcEndpoint = process.env.SQD_RPC_ENDPOINT;

    if (!sqdGateway) {
      throw new Error("getProcessor: SQD_GATEWAY is not set");
    }
    if (!sqdRpcEndpoint) {
      throw new Error("getProcessor: SQD_RPC_ENDPOINT is not set");
    }

    return new EvmBatchProcessor()
      .setGateway(sqdGateway)
      .setRpcEndpoint(sqdRpcEndpoint)
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
  }
}
