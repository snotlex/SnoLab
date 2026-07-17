import { MixDesignMethod } from "./MixDesignMethod";
import { MethodNotFoundException, DuplicateMethodRegistrationError } from "./errors";
import { dreuxGorisseMethod } from "../methods/dreux-gorisse/DreuxGorisseMethod";

export class MixDesignMethodRegistry {
  private static instance: MixDesignMethodRegistry;
  private methods = new Map<string, MixDesignMethod>();

  private constructor() {
    // Automatically register default built-in methods
    this.register(dreuxGorisseMethod);
  }

  public static getInstance(): MixDesignMethodRegistry {
    if (!MixDesignMethodRegistry.instance) {
      MixDesignMethodRegistry.instance = new MixDesignMethodRegistry();
    }
    return MixDesignMethodRegistry.instance;
  }

  public register(method: MixDesignMethod): void {
    if (!method || !method.metadata || !method.metadata.id) {
      throw new Error("Invalid method metadata or missing ID.");
    }
    if (this.methods.has(method.metadata.id)) {
      throw new DuplicateMethodRegistrationError(method.metadata.id);
    }
    this.methods.set(method.metadata.id, method);
  }

  public unregister(methodId: string): void {
    this.methods.delete(methodId);
  }

  public has(methodId: string): boolean {
    return this.methods.has(methodId);
  }

  public get(methodId: string): MixDesignMethod {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new MethodNotFoundException(methodId);
    }
    return method;
  }

  public listActive(): MixDesignMethod[] {
    return Array.from(this.methods.values()).filter(
      (m) => m.metadata.status === "active"
    );
  }

  public listAll(): MixDesignMethod[] {
    return Array.from(this.methods.values());
  }

  public clear(): void {
    this.methods.clear();
  }
}
