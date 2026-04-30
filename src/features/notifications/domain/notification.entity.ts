export class Notification {
  constructor(
    public readonly id: string | undefined,
    public readonly userId: string,
    public readonly title: string,
    public readonly body: string,
    public readonly data: any | undefined,
    public readonly isRead: boolean,
    public readonly createdAt?: Date,
  ) {}

  static create(props: {
    userId: string;
    title: string;
    body: string;
    data?: any;
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
