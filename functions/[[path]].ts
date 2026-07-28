export async function onRequest(context: any) {

    const backendUrl =
      "https://jib-be-jib-api.emadg-dev.workers.dev";
  
  
    const url = new URL(context.request.url);
  
  
    const targetUrl =
      backendUrl +
      url.pathname +
      url.search;
  
  
    const request = new Request(targetUrl, {
      method: context.request.method,
      headers: context.request.headers,
      body:
        context.request.method === "GET" ||
        context.request.method === "HEAD"
          ? undefined
          : await context.request.arrayBuffer()
    });
  
  
    const response = await fetch(request);
  
  
    const newResponse = new Response(
      response.body,
      response
    );
  
  
    return newResponse;
  }