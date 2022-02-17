enum colors {
  SUCCESS = 5763719,
  FAILURE = 15158332,
  DEFAULT = 3426654,
}

export class helpers {
  static readonly imageUrl =
    "https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/120/mozilla/36/rocket_1f680.png";

  static getColor(status: string | undefined): number {
    switch (status) {
      case "Success":
        return colors.SUCCESS;
      case "Failure":
        return colors.FAILURE;
      default:
        return colors.DEFAULT;
    }
  }

  static addZero(i: number): string {
    return i < 10 ? "0" + i.toString() : i.toString();
  }
}
