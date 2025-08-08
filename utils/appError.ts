class AppError extends Error {
  public statusCode: number;
  public error_code: string;
  public success: boolean;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, error_code: string, success = false) {
    super(message);

    this.success = success;
    this.statusCode = statusCode;
    this.error_code = error_code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
