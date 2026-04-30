export class PushSubscription {
  constructor(
    public readonly id: string | undefined,
    public readonly userId: string,
    public readonly endpoint: string,
    public readonly p256dh: string,
    public readonly auth: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
  ) {}

  static create(props: {
    userId: string;
    endpoint: string;
    p256dh: string;
    auth: string;
  }): PushSubscription {
    return new PushSubscription(
      undefined,
      props.userId,
      props.endpoint,
      props.p256dh,
      props.auth,
    );
  }
}
