export class Notification {
  constructor(
    public readonly id: string | undefined,
    public readonly userId: string,
    public readonly title: string,
    public readonly body: string,
    public readonly data: Record<string, unknown> | undefined,
    public readonly isRead: boolean,
    public readonly createdAt?: Date,
  ) {}

  static create(props: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Notification {
    return new Notification(
      undefined,
      props.userId,
      props.title,
      props.body,
      props.data,
      false,
    );
  }
}
