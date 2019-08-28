### VueGC

CLI command to generate a Vue component for VueJS MVC (not instance)

`vuegc --name HelloWorld [--path ./component [--scoped true [--style css]]]`

Required flag(s): 
--name:     Name of the component

Optional flag(s): 
--path:     Path where to generate the component.vue, start from root folder of VueJS project [Default: ./component/]
--scoped:   Boolean for scoped tag on style inside the file.vue
--style:    Pre-processor CSS [Default: css]
