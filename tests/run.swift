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
let reviewResult = context.evaluateScript(try String(contentsOfFile: "tests/review.test.js", encoding: .utf8))
if failed { exit(1) }
print(reviewResult?.toString() ?? "No review result")
context.evaluateScript(try String(contentsOfFile: "speech.js", encoding: .utf8))
let speechResult = context.evaluateScript(try String(contentsOfFile: "tests/speech.test.js", encoding: .utf8))
// Compile the browser entry point without requiring a DOM.
context.setObject(try String(contentsOfFile: "app.js", encoding: .utf8), forKeyedSubscript: "appSource" as NSString)
context.evaluateScript("new Function(appSource)")
if failed { exit(1) }
print(speechResult?.toString() ?? "No speech result")
