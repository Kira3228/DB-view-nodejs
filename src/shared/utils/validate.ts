import { validationResult } from "express-validator";

export function UseValidators(validators: any[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: any, req: any, res: any, next: any) {
      try {
        for (const validator of validators) {
          await validator(req, res, () => { });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          return res.status(400).json({ errors: errors.array() });
        }

        return await originalMethod.call(this, req, res, next);
      } catch (error: any) {
        if (!res.headersSent) {
          res.status(500).json({ error: error.message });
        } else {
          next(error);
        }
      }
    };
  };
}