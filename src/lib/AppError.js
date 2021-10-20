export default class AppError extends Error {
  constructor(title, message) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
    this.title = title;
  }
}