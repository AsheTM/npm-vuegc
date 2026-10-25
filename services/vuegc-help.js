
module.exports = function() {
    console.log(`
__     ___   _ _____ ____  ____
\\ \\   / / | | | ____/ ___|/ ___|
 \\ \\ / /| | | |  _|| |  _| |
  \\ V / | |_| | |__| |_| | |___
   \\_/   \\___/|_____\\____|\\____|

vuegc --name HelloWorld.vue [--scoped [true|false] [--style css]]

Required flag(s):
--name:     Name of the component

Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: scss] [Value supported: css, scss, stylus]
`);
    process.exit(0);
}
