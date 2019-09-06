### VueGC

CLI command to generate a Vue component for VueJS MVC (not instance) in /src/ folder

`vuegc --name HelloWord.vue [--scoped [true|false] [--style css]]`

Required flag(s):

* --name:   Name of the component

Optional flag(s):

* --scoped: Boolean for scoped tag on style inside the file.vue [Default: true]

* --style:  Pre-processor CSS [Default: css] [Value supported: css, scss, stylus]

It generates component file .vue like this: 

``` vue

<template>
    <div id="Helloworld"> Component <span>Helloworld</span> generated by <a href="">VueGC</a> </div>
</template>

<script>
export default {
    name: "Helloworld", 
    props: { }, 
    data() { }, 
    methods() { }
}
</script>

<style lang="scss" scoped>
    #Helloworld{
    	font-size: 16px;
    	line-height: 150%;	
    }
    span{ font-weight: bold; }	
    a{ font-style: italic; }
</style>

```

For help section, tap `vuegc`
