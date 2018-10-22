import request from 'request';
import freeport from 'freeport';

export function tester({
    url,
    server,
    method = 'POST',
    contentType = 'application/graphql',
    authorization = null,
    headers
}) {
    return (query, requestOptions) => {
        return new Promise((resolve, reject) => {
            if (server) {
                freeport((err, port) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(server.creator(port)
                            .then((runningServer) => {
                                return {
                                    server: runningServer.server,
                                    url: runningServer.url + url
                                }
                            }));
                    }
                });
            } else {
                resolve({
                    url
                });
            }
        }).then(({url, server}) => {
            return new Promise((resolve, reject) => {
                let baseHeaders = {
                    'Content-Type': contentType
                };
                if (authorization !== null) baseHeaders['Authorization'] = authorization;
                let extHeaders = Object.assign(baseHeaders, headers);
                if (requestOptions && requestOptions.hasOwnProperty('headers')) {
                    // requestOptions.headers takes precedence on header keys
                    extHeaders = Object.assign(extHeaders, requestOptions.headers);
                    // now it's merged, don't wholly override with Object.assign into options as below
                    delete requestOptions.headers;
                }
                let options = {
                    method,
                    uri: url,
                    extHeaders,
                    body: query
                };
                options = Object.assign(options, requestOptions);
                request(options, (error, message, body) => {
                    if (server && typeof(server.shutdown) === 'function') {
                        server.shutdown();
                    }

                    if (error) {
                        reject(error);
                    } else {
                        const result = JSON.parse(body);

                        resolve({
                            raw: body,
                            data: result.data,
                            errors: result.errors,
                            headers: message.headers,
                            status: message.statusCode,
                            success: !result.hasOwnProperty('errors')
                        });
                    }
                });
            });
        });
    };
}
