export class IdentityScope {
  private identity: string | null = null;
  private epoch = 0;
  change(identity: string | null) {
    if (this.identity !== identity) {
      this.identity = identity;
      this.epoch++;
    }
  }
  capture() {
    return this.epoch;
  }
  isCurrent(epoch: number) {
    return epoch === this.epoch;
  }
}
export class ResendCooldown {
  private until = 0;
  constructor(private now: () => number = () => performance.now()) {}
  sent() {
    this.until = this.now() + 60000;
  }
  remaining() {
    return Math.max(0, Math.ceil((this.until - this.now()) / 1000));
  }
}
