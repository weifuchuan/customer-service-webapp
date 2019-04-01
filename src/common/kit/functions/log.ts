const log = {
  info: function(...args: any[]) {
    try {
      throw new Error();
    } catch (e) {
      console.log(...args);
      console.log("Stack:" + e.stack);
      var loc = e.stack.replace(/Error\n/).split(/\n/)[1].replace(/^\s+|\s+$/, "");
      console.log("Location: " + loc + "");
    }
  }
};

export default log;