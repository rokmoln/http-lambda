import _ from 'lodash-firecloud';
import http from 'http';
import net from 'net';
import querystring from 'querystring';

import {
  Context,
  Event
} from './types';

declare module 'http' {
  interface IncomingMessage {
    chunkedEncoding: boolean;
    _removedHeader: {
      [key: string]: boolean;
    };
  }
}

export class IncomingMessage extends http.IncomingMessage {
  body: string | Buffer;

  ctx: Context;

  constructor(
    socket: {
      destroy: (err?: Error) => void;
    },
    e: Event,
    ctx: Context
  ) {
    super(socket as net.Socket);
    this.httpVersionMajor = 1;
    this.httpVersionMinor = 1;
    this.httpVersion = '1.1';
    this.chunkedEncoding = false;
    this._removedHeader = {
      'transfer-encoding': true
    };

    let queryParameters = _.defaultTo(e.queryStringParameters, {});
    let query = querystring.stringify(queryParameters);
    query = query.length > 0 ? `?${query}` : query;
    this.method = e.httpMethod;
    this.url = `${e.path}${query}`;
    this.headers = _.cloneDeep(e.headers);
    this.headers = _.mapKeys(this.headers, function(_value, key) {
      return _.toLower(key);
    });
    this.headers['content-length'] = _.toString(_.defaultTo(e.body, '').length);
    // see https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
    this.body = e.isBase64Encoded ? Buffer.from(e.body, 'base64') : e.body;
    this.ctx = ctx;
  }
}

export default IncomingMessage;
