const TinyTest = {

    run: function (tests) {
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

    fail: function (msg) {
        throw new Error('fail(): ' + msg);
    },

    assert: function (value, msg) {
        if (!value) {
            throw new Error('assert(): ' + msg);
        }
    },

    assertEquals: function (expected, actual) {
        if (expected != actual) {
            throw new Error('assertEquals() "' + expected + '" != "' + actual + '"');
        }
    },

    assertStrictEquals: function (expected, actual) {
        if (expected !== actual) {
            throw new Error('assertStrictEquals() "' + expected + '" !== "' + actual + '"');
        }
    },

};

const fail = TinyTest.fail,
    assert = TinyTest.assert,
    assertEquals = TinyTest.assertEquals,
    eq = TinyTest.assertEquals, // alias for assertEquals
    assertStrictEquals = TinyTest.assertStrictEquals,
    tests = TinyTest.run;
