import { HashAndHeight } from "@subsquid/typeorm-store/lib/interfaces";

interface RollbackParams {
  oldHead: HashAndHeight;
  newHead: HashAndHeight;
}

/**
 * StreamAdaptor is an abstract class that defines the interface for a stream adaptor.
 * It is used to connect to a stream and publish messages to it.
 */
export abstract class StreamAdaptor<PublishParams> {
  /**
   * Connect to the stream.
   */
  abstract connect(): Promise<void>;

  /**
   * Publish a message to the stream.
   */
  abstract publish(params: PublishParams): Promise<void>;

  /**
   * Publish a rollback message to the message broker in case of a reorg
   */
  abstract publishRollback(params: RollbackParams): Promise<void>;
}
