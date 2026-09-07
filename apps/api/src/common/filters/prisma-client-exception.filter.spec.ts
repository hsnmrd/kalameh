import { HttpStatus } from '@nestjs/common';
import { Prisma } from '@workspace/database';
import { PrismaClientExceptionFilter } from './prisma-client-exception.filter';

describe('PrismaClientExceptionFilter', () => {
  it('maps missing required records to HTTP 404', () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) }),
    };
    const exception = new Prisma.PrismaClientKnownRequestError(
      'Required record not found',
      { code: 'P2025', clientVersion: 'test' },
    );

    new PrismaClientExceptionFilter().catch(exception, host as never);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'Resource not found',
      error: 'Not Found',
    });
  });

  it('rethrows Prisma errors it does not own', () => {
    const exception = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: 'test' },
    );

    expect(() =>
      new PrismaClientExceptionFilter().catch(exception, {} as never),
    ).toThrow(exception);
  });
});
