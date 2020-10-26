# lumberjack-client

This is a small Lumberjack V2 client supporting JSON data, compression and TLS sockets.
The client will do its best to reconnect when disconnected, queuing its outing messages
as necessary.

### Socket

```javascript
const client = new LumberjackClient({
  host: 'localhost',
  port: 5044,
})

client.log({
  '@timestamp': new Date()
  host: {
    hoshname: os.hostname(),
  },
  message: 'hello world',
})
```

### TLS Socket

```
const client = new LumberjackClient({
  host: 'localhost',
  port: 5044,
  cert: fs.readFileSync('client.crt'),
  key: fs.readFileSync('client.key'),
  ca: [fs.readFileSync('ca.pem')],
}, true)

client.log({
  '@timestamp': new Date()
  host: {
    hoshname: os.hostname(),
  },
  message: 'hello tls server',
})
```
