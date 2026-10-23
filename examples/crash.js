// Example: crashes with a TypeError. Run "CodeWhisperer: Run File" on this file to see an explanation.
function getUserName(user) {
    return user.name.toUpperCase();
}

function greet(user) {
    const name = getUserName(user);
    console.log(`Hello, ${name}!`);
}
const noUser = null;
greet(noUser);