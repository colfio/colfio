type Testable = { [P in keyof Action<void>]: Action<void>[P] }


const TinyTest = {

    run: function (tests: Testable) {
        let failures = 0;
        for (let testName in tests) {
            let testAction = tests[testName];
            try {
                testAction();
                console.log('Test:', testName, 'OK');
            } catch (e) {
                failures++;
                console.error('Test:', testName, 'FAILED', e);
                console.error(e.stack);
            }
        }
        setTimeout(function () { // Give document a chance to complete
            if (window.document && document.body) {
                document.body.style.backgroundColor = (failures == 0 ? '#99ff99' : '#ff9999');
            }
        }, 0);
    },

    fail: function (msg: string) {
        throw new Error('fail(): ' + msg);
    },

    assert: function (value: boolean, msg: string) {
        if (!value) {
            throw new Error('assert(): ' + msg);
        }
    },

    assertEquals: function (expected: any, actual: any) {
        if (expected != actual) {
            throw new Error('assertEquals() "' + expected + '" != "' + actual + '"');
        }
    },

    assertStrictEquals: function (expected: any, actual: any) {
        if (expected !== actual) {
            throw new Error('assertStrictEquals() "' + expected + '" !== "' + actual + '"');
        }
    },

};

export var fail = TinyTest.fail;
export var assert = TinyTest.assert;
export var assertEquals = TinyTest.assertEquals;
export var eq = TinyTest.assertEquals; // alias for assertEquals
export var assertStrictEquals = TinyTest.assertStrictEquals;
export var tests = TinyTest.run;
