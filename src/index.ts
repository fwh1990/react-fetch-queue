type ShouldInsert<T extends {}> = (props: T) => boolean;

type OnFetch<T extends {}, K extends keyof T> = (props: T, ids: T[K][]) => Promise<any> | Promise<any>[];

export class Queue<Props extends {}, Key extends keyof Props> {
  private static readonly TIMEOUT_DURATION = 100;

  private static readonly MAX_REQUEST_LIMIT = 35;

  private timeout?: number;

  private readonly waitingItems = new Set<Props[Key]>();

  private readonly fetchingItems = new Set<Props[Key]>();

  private readonly shouldInsert: ShouldInsert<Props>;

  private readonly onFetch: OnFetch<Props, Key>;

  private readonly property: Key;

  private readonly batchLimit: number;

  constructor(params: {
    property: Key;
    shouldInsert: ShouldInsert<Props>;
    onFetch: OnFetch<Props, Key>;
    // Value 0 means no limit
    batchLimit?: number;
  }) {
    this.shouldInsert = params.shouldInsert;
    this.onFetch = params.onFetch;
    this.property = params.property;
    this.batchLimit = params.batchLimit === undefined
      ? Queue.MAX_REQUEST_LIMIT
      : Math.max(0, params.batchLimit);
  }

  public insert(props: Props) {
    const value = props[this.property];

    if (
      this.waitingItems.has(value) ||
      this.fetchingItems.has(value) ||
      !this.shouldInsert(props)
    ) {
      return;
    }

    this.waitingItems.add(value);
    this.createTask(props);
  }

  private createTask(props: Props) {
    if (this.timeout) {
      return;
    }

    this.timeout = setTimeout(() => {
      const totalValues = Array.from(this.waitingItems);
      const batches: Array<Array<Props[Key]>> = [];

      this.waitingItems.clear();
      totalValues.forEach((value, index) => {
        const batchIndex = this.batchLimit === 0 ? 0 : Math.floor(index / this.batchLimit);

        if (!batches[batchIndex]) {
          batches[batchIndex] = [];
        }

        batches[batchIndex].push(value);
        this.fetchingItems.add(value);
      });

      batches.forEach((values) => {
        const runners = this.onFetch(props, values);

        if (Array.isArray(runners)) {
          Promise
            .all(runners)
            .finally(() => {
              this.afterFetch(values);
            });
        } else {
          runners
            .finally(() => {
              this.afterFetch(values);
            });
        }
      });

      this.timeout = undefined;
    }, Queue.TIMEOUT_DURATION);
  }

  private afterFetch(values: Props[Key][]) {
    if (this.fetchingItems.size === values.length) {
      this.fetchingItems.clear();
    } else {
      values.forEach(this.fetchingItems.delete.bind(this.fetchingItems));
    }
  }
}
