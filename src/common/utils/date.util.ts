export class DateUtil {
  /**
   * Adds specified hours to a given date.
   * @param date The date to add hours to
   * @param hours The number of hours to add
   * @returns A new Date object
   */
  static addHours(date: Date, hours: number): Date {
    const newDate = new Date(date);
    newDate.setTime(newDate.getTime() + hours * 60 * 60 * 1000);
    return newDate;
  }

  /**
   * Generates an expiration date based on the number of hours from now.
   * @param hours Number of hours (default: 24)
   * @returns Date object
   */
  static getExpirationDate(hours: number = 24): Date {
    return this.addHours(new Date(), hours);
  }
}
