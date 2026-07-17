import { ValidationError } from "./types";

export class MixDesignException extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MixDesignException";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MethodNotFoundException extends MixDesignException {
  public methodId: string;

  constructor(methodId: string) {
    super(`Mix design method with ID '${methodId}' is not registered.`);
    this.name = "MethodNotFoundException";
    this.methodId = methodId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class MethodValidationException extends MixDesignException {
  public errors: ValidationError[];

  constructor(errors: ValidationError[], message = "Validation failed for mix design inputs.") {
    super(message);
    this.name = "MethodValidationException";
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class CalculationException extends MixDesignException {
  public stepId?: string;
  public details?: Record<string, any>;

  constructor(message: string, stepId?: string, details?: Record<string, any>) {
    super(message);
    this.name = "CalculationException";
    this.stepId = stepId;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateMethodRegistrationError extends MixDesignException {
  public methodId: string;

  constructor(methodId: string) {
    super(`Mix design method with ID '${methodId}' is already registered.`);
    this.name = "DuplicateMethodRegistrationError";
    this.methodId = methodId;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnsupportedMethodVersionError extends MixDesignException {
  public methodId: string;
  public requestedVersion: string;
  public supportedVersion: string;

  constructor(methodId: string, requestedVersion: string, supportedVersion: string) {
    super(`Unsupported version '${requestedVersion}' for method '${methodId}'. Supported version is '${supportedVersion}'.`);
    this.name = "UnsupportedMethodVersionError";
    this.methodId = methodId;
    this.requestedVersion = requestedVersion;
    this.supportedVersion = supportedVersion;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
