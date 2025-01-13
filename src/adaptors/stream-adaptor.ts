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
  abstract publish(p: PublishParams): Promise<void>;
}
