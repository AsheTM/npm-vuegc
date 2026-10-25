
module.exports = function() {
    console.log(`
__     ___   _ _____ ____  ____
\\ \\   / / | | | ____/ ___|/ ___|
 \\ \\ / /| | | |  _|| |  _| |
  \\ V / | |_| | |__| |_| | |___
   \\_/   \\___/|_____\\____|\\____|

vuegc --name HelloWorld.vue [--scoped [true|false]] [--style css] [--path components] [--blank] [--force] [--dry-run] [--no-template|--no-script|--no-style] [--props title,items]

Required flag(s):
--name:     Name of the component

Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: scss] [Value supported: css, scss, sass, less, stylus]
--path:     Folder inside src/ for the component, created if missing [Default: src/]
--blank:    Empty template and style, without the demo content [Default: false]
--force:    Overwrite the component if it already exists [Default: false]
--dry-run:  Print the component instead of writing it [Default: false]
--no-template, --no-script, --no-style:
            Leave the section out (at least one must remain) [Default: false]
--props:    Comma-separated prop names, declared with an open type [Default: none]
`);
    process.exit(0);
}
