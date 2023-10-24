export const API_EndPoint = async function (HttpContext) {
  if (!HttpContext.path.isAPI) {
    return false;
  } else {
    let controllerName = HttpContext.path.controllerName;
    if (controllerName != undefined) {
      try {
        // dynamically import the targeted controller
        // if the controllerName does not exist the catch section will be called
        const { default: Controller } = await import(
          "./controllers/" + controllerName + ".js"
        );

        // instanciate the controller

        let controller = new Controller(HttpContext);

        if (HttpContext.req.url === "/api/bookmarks?") {
          HttpContext.response.HTML(`
                    List of parameters in query strings:
                    ? sort=key
                    return all words sorted by key values (word)
                    ? sort,desc=key
                    return all words sorted by descending key values
                    ? key=value
                    return the word with key value = value
                    ? key=value*
                    return the word with key value that start with value
                    ? key=*value*
                    return the word with key value that contains value
                    ? key=*value
                    return the word with key value end with value
                    page?limit=int&offset=int
                    return limit words of page offset
                    `);
        }

        switch (HttpContext.req.method) {
          case "HEAD":
            controller.head();
            return true;
          case "GET":
            controller.get(HttpContext.path.id);
            return true;
          case "POST":
            if (HttpContext.payload) controller.post(HttpContext.payload);
            else HttpContext.response.unsupported();
            return true;
          case "PUT":
            if (HttpContext.payload) controller.put(HttpContext.payload);
            else HttpContext.response.unsupported();
            return true;
          case "DELETE":
            controller.remove(HttpContext.path.id);
            return true;
          default:
            HttpContext.response.notImplemented();
            return true;
        }
      } catch (error) {
        console.log("API_EndPoint Error message: \n", error.message);
        console.log("Stack: \n", error.stack);
        HttpContext.response.notFound();
        return true;
      }
    } else {
      // not an API endpoint
      // must be handled by another middleware
      return false;
    }
  }
};
