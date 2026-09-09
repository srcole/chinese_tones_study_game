// Run with: swift -module-cache-path /tmp/tone-garden-swift-cache tests/run.swift
import Foundation
import JavaScriptCore
let context = JSContext()!
var failed = false
context.exceptionHandler = { _, exception in
    fputs("FAIL: \(exception?.toString() ?? "Unknown error")\n", stderr)
    failed = true
}
let source = try String(contentsOfFile: "engine.js", encoding: .utf8)
context.evaluateScript(source)
let database = try String(contentsOfFile: "chinese_word_database_20260909.csv", encoding: .utf8)
context.setObject(database, forKeyedSubscript: "database" as NSString)
let tests = try String(contentsOfFile: "tests/engine.test.js", encoding: .utf8)
let result = context.evaluateScript(tests)
if failed { exit(1) }
print(result?.toString() ?? "No result")
