export class HttpError extends Error {
  status: number;
  code?: string
  details?: any
  constructor(staus: number, message: string, code?: string, details?: any) {
    super(message);
    this.status = staus
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, new.target.prototype)
    Error.captureStackTrace?.(this, this.constructor)
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = `Resource not found`) {
    super(404, message, `NOT_FOUND`)
  }
}

export class ValidationError extends HttpError {
  constructor(message = 'Validation failed', details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}
