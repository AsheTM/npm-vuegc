
module.exports = function() {
    console.log(`
__     ___   _ _____ ____  ____
\\ \\   / / | | | ____/ ___|/ ___|
 \\ \\ / /| | | |  _|| |  _| |
  \\ V / | |_| | |__| |_| | |___
   \\_/   \\___/|_____\\____|\\____|

vuegc --name HelloWorld.vue [--scoped [true|false]] [--style css] [--path components] [--blank] [--force]

Required flag(s):
--name:     Name of the component

Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: scss] [Value supported: css, scss, stylus]
--path:     Folder inside src/ for the component, created if missing [Default: src/]
--blank:    Empty template and style, without the demo content [Default: false]
--force:    Overwrite the component if it already exists [Default: false]
`);
    process.exit(0);
}
