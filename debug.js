import Debugger from "debug";

const debug = Debugger("grabber");
debug.log = console.log.bind(console);

Debugger.enable("grabber");

export default debug;
