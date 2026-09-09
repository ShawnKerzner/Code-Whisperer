// -----------------------------------------------------------------------
// TEST FIXTURE — deliberately CORRECT code, used to confirm CodeWhisperer's
// "clean exit" branch. Running this should log
// "Process exited cleanly with code 0" — NOT the error branch.
// -----------------------------------------------------------------------

function getUserName(user) {
    return user.name.toUpperCase();
}

function greet(user) {
    const name = getUserName(user);
    console.log(`Hello, ${name}!`);
}

const realUser = {name: 'Shawn'};
greet(realUser);

