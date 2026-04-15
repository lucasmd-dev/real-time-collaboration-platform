export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const Errors = {
  Unauthorized: () => new AppError('UNAUTHORIZED', 'Não autorizado', 401),
  Forbidden: () => new AppError('FORBIDDEN', 'Acesso negado', 403),
  NotFound: (message: string) => new AppError('NOT_FOUND', message, 404),
  Conflict: (message: string) => new AppError('CONFLICT', message, 409),
  BadRequest: (message: string) => new AppError('BAD_REQUEST', message, 400),
}
