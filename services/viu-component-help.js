
module.exports = function() {
    console.log(`
__       __  _    _    _
\\ \\     / / | |  | |  | |
 \\ \\   / /  | |  | |  | |
  \\ \\ / /   | |  | |  | |
   \\ v /    | |  | |  | |
    \\_/     |_|  |______|

viu --name HelloWord.vue [--scoped [true|false] [--style css]]

Required flag(s):
--name:     Name of the component

Optional flag(s):
--scoped:   Boolean for scoped tag on style inside the file.vue [Default: true]
--style:    Pre-processor CSS [Default: css] [Value supported: css, scss, stylus]
`);
    process.exit(0);
}
