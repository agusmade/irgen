
import { createExtensionContext } from "../src/extensions/context.js";
import { validatorRegistry } from "../src/dsl/validator-registry.js";
import { templateRegistry } from "../src/cli/template-registry.js";
import assert from "node:assert";

async function testExtensionDX() {
    console.log("🧪 Testing Extension DX Registration...");

    const ctx = createExtensionContext();

    // 1. Test Validator Registration
    ctx.registerValidator("test-validator", (bundle: any) => {
        return [{ type: "warning", message: "Test Warning" }];
    });

    const validators = validatorRegistry.getValidators();
    assert(validators.length > 0, "Validator should be registered");
    const msgs = validators[0]({ apps: [] } as any);
    assert(msgs[0].message === "Test Warning", "Validator should return correct message");
    console.log("✅ Validator registration verified");

    // 2. Test Template Registration
    ctx.registerTemplate({
        id: "test-template",
        title: "Test Template",
        generate: () => { }
    });

    const templates = templateRegistry.getTemplates();
    const found = templates.find(t => t.id === "test-template");
    assert(found, "Template should be registered");
    assert(found.title === "Test Template", "Template should have correct title");
    console.log("✅ Template registration verified");

    console.log("🚀 All Extension DX tests passed!");
}

testExtensionDX().catch(err => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
