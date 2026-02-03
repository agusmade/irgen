
import { DeclBundle } from "../ir/decl/index.js";
import { ValidationMessage } from "./validator.js";

export type ValidatorFn = (bundle: DeclBundle) => ValidationMessage[];

class ValidatorRegistry {
    private validators: Map<string, ValidatorFn> = new Map();

    register(id: string, validator: ValidatorFn) {
        this.validators.set(id, validator);
    }

    getValidators(): ValidatorFn[] {
        return Array.from(this.validators.values());
    }

    clear() {
        this.validators.clear();
    }
}

export const validatorRegistry = new ValidatorRegistry();
