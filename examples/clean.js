// Example: runs without errors. CodeWhisperer should report a clean exit.//
function getUserName(user) {
    return user.name.toUpperCase();
}

function greet(user) {
    const name = getUserName(user);
    console.log(`Hello, ${name}!`);
}

const realUser = {name: 'Shawn'};
greet(realUser);

