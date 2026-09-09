// -----------------------------------------------------------------------
// TEST FIXTURE — intentionally broken code, used to manually test
// CodeWhisperer's error-detection pipeline (spawn -> capture stderr -> exit).
// Running this file with "CodeWhisperer: Run File" should trigger the
// "error detected" branch in extension.ts, since it throws a TypeError.
// -----------------------------------------------------------------------

function getUserName(user) {
    // Assumes "user" is a real object with a .name property.
    //If "user" is null/undefined, this line throws the error. This is my intentional bug for the test.
    return user.name.toUpperCase();
}

function greet(user) {
    const name = getUserName(user);
    console.log(`Hello, ${name}!`);
}

// Intentionally passing null instead of a real object to force a crash.
const noUser = null;
greet(noUser);